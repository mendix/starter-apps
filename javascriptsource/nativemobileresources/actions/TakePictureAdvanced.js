import { NativeModules, Alert, Platform, Linking } from 'react-native';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import { getLocales } from 'react-native-localize';

// This file was generated by Mendix Modeler.
/**
 * Take a picture using the camera or import one from the image library on the device.
 *
 * The result is an ImageMetaData object. Most items are self-explanatory.
 *
 * The FileType is not the extension but the mime type, for example image/jpeg when the image is a jpg file
 * You can get the right extension from the FileName:
 * substring($ImageMetaData/FileName, findLast($ImageMetaData/FileName, '.'))
 *
 * @param {MxObject} picture - This field is required.
 * @param {"NativeMobileResources.PictureSource.camera"|"NativeMobileResources.PictureSource.imageLibrary""} pictureSource - Select a picture from the library or the camera. The default is camera.
 * @param {"NativeMobileResources.PictureQuality.original"|"NativeMobileResources.PictureQuality.low"|"NativeMobileResources.PictureQuality.medium"|"NativeMobileResources.PictureQuality.high"|"NativeMobileResources.PictureQuality.custom"} pictureQuality - The default picture quality is 'Medium'.
 * @param {Big} maximumWidth - The picture will be scaled to this maximum pixel width, while maintaining the aspect ratio.
 * @param {Big} maximumHeight - The picture will be scaled to this maximum pixel height, while maintaining the aspect ratio.
 * @param {MxObject} pictureData - Additional info about the picture will be stored in this object. Create it before calling this action.
 * @returns {Promise.<mendix.lib.MxObject>}
 */
async function TakePictureAdvanced(picture, pictureSource, pictureQuality, maximumWidth, maximumHeight) {
    // BEGIN USER CODE
    if (!picture) {
        return Promise.reject(new Error("Input parameter 'Picture' is required"));
    }
    if (!picture.inheritsFrom("System.FileDocument")) {
        return Promise.reject(new Error(`Entity ${picture.getEntity()} does not inherit from 'System.FileDocument'`));
    }
    if (pictureQuality === "custom" && !maximumHeight && !maximumWidth) {
        return Promise.reject(new Error("Picture quality is set to 'Custom', but no maximum width or height was provided"));
    }
    // V3 dropped the feature of providing an action sheet so users can decide on which action to take, camera or library.
    const nativeVersionMajor = NativeModules.ImagePickerManager.showImagePicker ? 2 : 4;
    const RNPermissions = nativeVersionMajor === 4 ? require("react-native-permissions") : null;
    const resultObject = await createMxObject("NativeMobileResources.ImageMetaData");
    try {
        let response = await takePicture();
        let pictureTaken;
        if (nativeVersionMajor === 2) {
            response = response;
            if (!response || !response.uri) {
                return Promise.resolve(resultObject);
            }
            pictureTaken = await storeFile(picture, response.uri);
            resultObject.set("PictureTaken", pictureTaken);
            resultObject.set("URI", response.uri);
            resultObject.set("IsVertical", response.isVertical);
            resultObject.set("Width", response.width);
            resultObject.set("Height", response.height);
            resultObject.set("FileName", 
            // eslint-disable-next-line no-useless-escape
            response.fileName ? response.fileName : /[^\/]*$/.exec(response.uri)[0]);
            resultObject.set("FileSize", response.fileSize);
            resultObject.set("FileType", response.type);
        }
        else {
            response = response;
            if (!response || !response.assets[0] || !response.assets[0].uri) {
                return Promise.resolve(resultObject);
            }
            pictureTaken = await storeFile(picture, response.assets[0].uri);
            resultObject.set("PictureTaken", pictureTaken);
            resultObject.set("URI", response.assets[0].uri);
            // Note:  V4 asset doesn't include isVertical
            resultObject.set("Width", response.assets[0].width);
            resultObject.set("Height", response.assets[0].height);
            resultObject.set("FileName", response.assets[0].fileName
                ? response.assets[0].fileName
                : // eslint-disable-next-line no-useless-escape
                    /[^\/]*$/.exec(response.assets[0].uri)[0]);
            resultObject.set("FileSize", response.assets[0].fileSize);
            resultObject.set("FileType", response.assets[0].type);
        }
        return Promise.resolve(resultObject);
    }
    catch (error) {
        if (error === "canceled") {
            return Promise.resolve(resultObject);
        }
        else {
            throw new Error(error);
        }
    }
    function takePicture() {
        return new Promise((resolve, reject) => {
            const options = nativeVersionMajor === 2 ? getOptionsV2() : getOptionsV4();
            getPictureMethod()
                .then(method => method(options, (response) => {
                if (response.didCancel) {
                    return resolve(undefined);
                }
                if (nativeVersionMajor === 2) {
                    response = response;
                    if (response.error) {
                        const unhandledError = handleImagePickerV2Error(response.error);
                        if (!unhandledError) {
                            return resolve(undefined);
                        }
                        return reject(new Error(response.error));
                    }
                    return resolve(response);
                }
                response = response;
                if (response.errorCode) {
                    handleImagePickerV4Error(response.errorCode, response.errorMessage);
                    return resolve(undefined);
                }
                return resolve(response);
            }))
                .catch(error => reject(error));
        });
    }
    function storeFile(imageObject, uri) {
        return new Promise((resolve, reject) => {
            fetch(uri)
                .then(response => response.blob())
                .then(blob => {
                // eslint-disable-next-line no-useless-escape
                const filename = /[^\/]*$/.exec(uri)[0];
                const filePathWithoutFileScheme = uri.replace("file://", "");
                mx.data.saveDocument(imageObject.getGuid(), filename, {}, blob, async () => {
                    await NativeModules.NativeFsModule.remove(filePathWithoutFileScheme);
                    imageObject.set("Name", filename);
                    mx.data.commit({
                        mxobj: imageObject,
                        callback: () => resolve(true),
                        error: (error) => reject(error)
                    });
                }, async (error) => {
                    await NativeModules.NativeFsModule.remove(filePathWithoutFileScheme);
                    reject(error);
                });
            })
                .catch(error => reject(error));
        });
    }
    async function getPictureMethod() {
        async function handleCameraRequest() {
            if (Platform.OS === "android" && nativeVersionMajor === 4) {
                await checkAndMaybeRequestAndroidPermission();
            }
            return launchCamera;
        }
        switch (pictureSource) {
            case "imageLibrary":
                return launchImageLibrary;
            case "camera":
                return handleCameraRequest();
            default:
                return handleCameraRequest();
        }
    }
    async function checkAndMaybeRequestAndroidPermission() {
        let requestResult;
        async function requestAndroidPermission() {
            requestResult = await RNPermissions.request(RNPermissions.PERMISSIONS.ANDROID.CAMERA);
            if (requestResult === RNPermissions.RESULTS.DENIED) {
                // re-enter request flow. note, if a request is denied twice, result = blocked.
                requestResult = await requestAndroidPermission();
            }
            return requestResult;
        }
        // https://github.com/zoontek/react-native-permissions#android-flow
        const statusResult = await RNPermissions.check(RNPermissions.PERMISSIONS.ANDROID.CAMERA);
        switch (statusResult) {
            case RNPermissions.RESULTS.UNAVAILABLE:
                throw new Error("The camera is unavailable.");
            case RNPermissions.RESULTS.BLOCKED:
                throw new Error("Camera access for this app is currently blocked.");
            case RNPermissions.RESULTS.DENIED:
                requestResult = await requestAndroidPermission();
                if (requestResult === RNPermissions.RESULTS.BLOCKED) {
                    throw new Error("Camera access for this app is currently blocked.");
                }
                break;
        }
    }
    function getOptionsV2() {
        const { maxWidth, maxHeight } = getPictureQuality();
        const [language] = getLocales().map(local => local.languageCode);
        const isDutch = language === "nl";
        return {
            mediaType: "photo",
            maxWidth,
            maxHeight,
            noData: true,
            title: isDutch ? "Foto toevoegen" : "Select a photo",
            cancelButtonTitle: isDutch ? "Annuleren" : "Cancel",
            takePhotoButtonTitle: isDutch ? "Foto maken" : "Take photo",
            chooseFromLibraryButtonTitle: isDutch ? "Kies uit bibliotheek" : "Choose from library",
            permissionDenied: {
                title: isDutch
                    ? "Deze app heeft geen toegang tot uw camera of foto bibliotheek"
                    : "This app does not have access to your camera or photo library",
                text: isDutch
                    ? "Ga naar Instellingen > Privacy om toegang tot uw camera en bestanden te verlenen."
                    : "To enable access, tap Settings > Privacy and turn on Camera and Photos/Storage.",
                reTryTitle: isDutch ? "Instellingen" : "Settings",
                okTitle: isDutch ? "Annuleren" : "Cancel"
            },
            storageOptions: {
                skipBackup: true,
                cameraRoll: false,
                privateDirectory: true
            }
        };
    }
    function getOptionsV4() {
        const { maxWidth, maxHeight } = getPictureQuality();
        return {
            mediaType: "photo",
            maxWidth,
            maxHeight
        };
    }
    function getPictureQuality() {
        switch (pictureQuality) {
            case "low":
                return {
                    maxWidth: 1024,
                    maxHeight: 1024
                };
            case "medium":
            default:
                return {
                    maxWidth: 2048,
                    maxHeight: 2048
                };
            case "high":
                return {
                    maxWidth: 4096,
                    maxHeight: 4096
                };
            case "custom":
                return {
                    maxWidth: Number(maximumWidth),
                    maxHeight: Number(maximumHeight)
                };
        }
    }
    function handleImagePickerV2Error(error) {
        const ERRORS = {
            AndroidPermissionDenied: "Permissions weren't granted",
            iOSPhotoLibraryPermissionDenied: "Photo library permissions not granted",
            iOSCameraPermissionDenied: "Camera permissions not granted"
        };
        switch (error) {
            case ERRORS.iOSPhotoLibraryPermissionDenied:
                showAlert("This app does not have access to your photo library", "To enable access, tap Settings and turn on Photos.");
                return;
            case ERRORS.iOSCameraPermissionDenied:
                showAlert("This app does not have access to your camera", "To enable access, tap Settings and turn on Camera.");
                return;
            case ERRORS.AndroidPermissionDenied:
                // Ignore this error because the image picker plugin already shows an alert in this case.
                return;
            default:
                return error;
        }
    }
    function showAlert(title, message) {
        Alert.alert(title, message, [
            { text: "Cancel", style: "cancel" },
            ...(Platform.OS === "ios"
                ? [{ text: "Settings", onPress: () => Linking.openURL("app-settings:") }]
                : [])
        ], { cancelable: false });
    }
    function createMxObject(entity) {
        return new Promise((resolve, reject) => {
            mx.data.create({
                entity,
                callback: mxObject => resolve(mxObject),
                error: () => reject(new Error(`Could not create '${entity}' object to store device info`))
            });
        });
    }
    function handleImagePickerV4Error(errorCode, errorMessage) {
        var _a;
        switch (errorCode) {
            case "camera_unavailable":
                showAlert("The camera is unavailable.", "");
                break;
            case "permission":
                showAlert("This app does not have access to your photo library or camera", "To enable access, tap Settings and turn on Camera and Photos.");
                break;
            case "others":
                showAlert("Something went wrong.", (_a = `${errorMessage}.`) !== null && _a !== void 0 ? _a : "Something went wrong while trying to access your Camera or photo library.");
                break;
            default:
                showAlert("Something went wrong.", "Something went wrong while trying to access your Camera or photo library.");
                break;
        }
    }
    // END USER CODE
}

export { TakePictureAdvanced };
