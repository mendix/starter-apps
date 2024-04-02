// This file was generated by Mendix Studio Pro.
//
// WARNING: Only the following code will be retained when actions are regenerated:
// - the import list
// - the code between BEGIN USER CODE and END USER CODE
// - the code between BEGIN EXTRA CODE and END EXTRA CODE
// Other code you write will be lost the next time you deploy the project.
import "mx-global";
import { Big } from "big.js";

// BEGIN EXTRA CODE
// END EXTRA CODE

/**
 * @param {string} targetName - Name of the filter to reset. Valid targets are: Number filter, Date filter, Text filter, Drop-down filter. You can find filter name in widget settings in the "Common" group (Properties>Common>Name).
 * @returns {Promise.<void>}
 */
export async function Reset_Filter(targetName) {
	// BEGIN USER CODE
    const plugin = window["com.mendix.widgets.web.plugin.externalEvents"];
    if (plugin) {
        plugin.emit(targetName, "reset.value");
    }
	// END USER CODE
}
