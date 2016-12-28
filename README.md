# react-native-source-maps
Utilities to easily add support of Source Maps to your React Native project

----------
#### Usage:
1) Add sourcemaps generation to your build script (or customize default one)
```
  ...
  --sourcemap-output "$DEST/main.jsbundle.map"
```


2) Initialise at the app start with source map bundle file and other options
```
import {initSourceMaps} from 'react-native-source-maps';
initSourceMaps({sourceMapBundle: "main.jsbundle.map", collapseInLine: true});
```

3) Use it with your logging utilities
Example:
```
const stack = !__DEV__ && await getStackTrace(error);
if (stack) {
    error.stack = stack;
}
log.error({message: 'Error (' + error.message + ')', error});
```

4) To caught all uncaught errors in app you can add global error handler:
```
import log from "../log";
import {getStackTrace} from 'react-native-source-maps';
import ErrorUtils from "ErrorUtils";

(async function initUncaughtErrorHandler() {
	const defaultGlobalHandler = ErrorUtils.getGlobalHandler();

	ErrorUtils.setGlobalHandler(async(error, isFatal) => {
		try {
			if (!__DEV__) {
				error.stack = await getStackTrace(error);
			}
			log.error({message: 'Uncaught error (' + error.message + ')', error, isFatal});
		}
		catch (error) {
			log.error({message: 'Unable to setup global handler', error});
		}

		if (__DEV__ && defaultGlobalHandler) {
			defaultGlobalHandler(error, isFatal);
		}
	});
})();
```

