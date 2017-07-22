# react-native-source-maps
Utilities to quickly add support of source-maps to your React Native project

As you probably already now, React Native minifies release code. 
It's perfect for bundle size and execution speed. 
But it can become a real pain to find production bug in such code.

For example error stack trace in your logging system can look like that:
```
0:file:///var/containers/Bundle/Application/B2C0D7FF-6CA3-4298-BDBF-10285CD4D88D/Debitoor.app/main.jsbundle:947:1763
1:u@file:///var/containers/Bundle/Application/B2C0D7FF-6CA3-4298-BDBF-10285CD4D88D/Debitoor.app/main.jsbundle:199:137
2:file:///var/containers/Bundle/Application/B2C0D7FF-6CA3-4298-BDBF-10285CD4D88D/Debitoor.app/main.jsbundle:199:891
...
```

And....
It's useless just to know about an error without a possibility to find it in the exact place of code. So we need source maps.
By using source maps, we can map the code being executed to the original code source files, making fixing bug much, much easier.

To make it look like this:
```
0:file:///var/containers/Bundle/Application/B2C0D7FF-6CA3-4298-BDBF-10285CD4D88D/Debitoor.app/main.jsbundle:947:1763
1:u@file:///var/containers/Bundle/Application/B2C0D7FF-6CA3-4298-BDBF-10285CD4D88D/Debitoor.app/main.jsbundle:199:137
2:file:///var/containers/Bundle/Application/B2C0D7FF-6CA3-4298-BDBF-10285CD4D88D/Debitoor.app/main.jsbundle:199:891
...
```

Firstly I'd like to mention that React Native CLI has a flag to build source maps alongside with JS code bundle.

How can we do this?

----------
#### Usage: 
##### 1. We need to modify how we JS code is bundled

For example, originally iOS builds use this packager script:
./node_modules/react-native/packager/react-native-xcode.sh
Which call React Native CLI bundle command this way:
```
$NODE_BINARY "$REACT_NATIVE_DIR/local-cli/cli.js" bundle \
  --entry-file "$ENTRY_FILE" \
  --platform ios \
  --dev $DEV \
  --reset-cache \
  --bundle-output "$BUNDLE_FILE" \
  --assets-dest "$DEST"
```
We need to modify this script and add one line:
```
  --sourcemap-output "$BUNDLE_FILE.map"
```
It can be done with simple patching of this file in npm postinstall script. Or creating custom bundle script.

##### 2. Install react-native-source-maps module
This module was built to map minified sources to original JS files. 
And to solve our pain to find actual place where an error occurred. 

`npm i react-native-source-maps`

##### 3. Initialize module at the app start with options
```
import {initSourceMaps} from 'react-native-source-maps';
initSourceMaps({sourceMapBundle: "main.jsbundle.map"});
```

##### 4. Use it with your logging utilities to replace minified error stack with original
Example:
```
const stack = !__DEV__ && await getStackTrace(error);
if (stack) {
    error.stack = stack;
}
log.error({message: 'Error (' + error.message + ')', error});
```

##### 5. Caught all uncaught errors in app by adding global error handler
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

----------
#### API:
Property     | Type | Description | Default value
------------ | ---- | ----------- | -------------
`sourceMapBundle` | string | source map bundle, for example "main.jsbundle.map" | undefined (Required)
`collapseInLine`  | bool   | Will collapse all stack trace in one line, otherwise return lines array | false
`projectPath`     | string | project path to remove from files path index | undefined (Optional)  
