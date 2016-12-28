# react-native-source-maps
Utilities to easily add support of Source Maps to your React Native project

----------
#### Usage:
1. Initialise at the app start with source map bundle file and other options
```
import {initSourceMaps} from 'react-native-source-maps';
initSourceMaps({sourceMapBundle: "main.jsbundle.map", collapseInLine: true});
```

2. Use it with your logging utilities
Example:
```
const stack = !__DEV__ && await getStackTrace(error);
if (stack) {
    error.stack = stack;
}
log.error({message: 'Error (' + error.message + ')', error});
```

3. To caught all uncaught errors in app you can add global error handler:
```
(async function initUncaughtErrorHandler() {
	ErrorUtils.setGlobalHandler(async(error, isFatal) => {
		try {
			const stack = !__DEV__ && await getStackTrace(error);
			if (stack) {
				error.stack = stack;
			}
			log.error({message: 'Uncaught error (' + error.message + ')', error, isFatal});
		}
		catch (error) {
			log.error({message: 'Unable to setup global handler', error});
		}
	});
})();
```

