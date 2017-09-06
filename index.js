import RNFS from "react-native-fs";
import SourceMap from "source-map";
import StackTrace from "stacktrace-js";
import { Platform } from "react-native";

let sourceMapper = undefined;
let options = undefined;

/**
 * Init Source mapper with options
 * Required:
 * @param {String} [opts.sourceMapBundle] - source map bundle, for example "main.jsbundle.map"
 * Optional:
 * @param {String} [opts.projectPath] - project path to remove from files path
 * @param {Boolean} [opts.collapseInLine] — Will collapse all stack trace in one line, otherwise return lines array
 */
export const initSourceMaps = async opts => {
	if (!opts || !opts.sourceMapBundle) {
		throw new Error('Please specify sourceMapBundle option parameter');
	}
	options = opts;
};

export const getStackTrace = async error => {
	if (!options) {
		throw new Error('Please firstly call initSourceMaps with options');
	}
	if (!sourceMapper) {
		sourceMapper = await createSourceMapper();
	}
	try {
		let minStackTrace;
		
		if (Platform.OS === "ios") {
			minStackTrace = await StackTrace.fromError(error);
		} else {
			minStackTrace = await StackTrace.fromError(error, { offline: true });
		}
		
		const stackTrace = minStackTrace.map(row => {
			const mapped = sourceMapper(row);
			const source = mapped.source || "";
			const fileName = options.projectPath ? source.split(options.projectPath).pop() : source;
			const functionName = mapped.name || "unknown";
			return {
				fileName,
				functionName,
				lineNumber: mapped.line,
				columnNumber: mapped.column,
				position: `${functionName}@${fileName}:${mapped.line}:${mapped.column}`
			};
		});
		return options.collapseInLine ? stackTrace.map(i => i.position).join('\n') : stackTrace;
	}
	catch (error) {
		throw error;
	}
};

const createSourceMapper = async () => {
	const SoureMapBundlePath = Platform.OS === "ios" ? `${RNFS.MainBundlePath}/${options.sourceMapBundle}` : options.sourceMapBundle;
	try {
		const fileExists = (Platform.OS === "ios") ? (await RNFS.exists(SoureMapBundlePath)) : (await RNFS.existsAssets(SoureMapBundlePath));
		if (!fileExists) {
			throw new Error(__DEV__ ?
				'Unable to read source maps in DEV mode' :
				`Unable to read source maps, possibly invalid sourceMapBundle file, please check that it exists here: ${SoureMapBundlePath}`
			);
		}

		const mapContents = (Platform.OS === "ios") ? (await RNFS.readFile(SoureMapBundlePath, 'utf8')) : (await RNFS.readFileAssets(SoureMapBundlePath, 'utf8'));
		const sourceMaps = JSON.parse(mapContents);
		const mapConsumer = new SourceMap.SourceMapConsumer(sourceMaps);

		return sourceMapper = row => {
			return mapConsumer.originalPositionFor({
				line: row.lineNumber,
				column: row.columnNumber,
			});
		};
	}
	catch (error) {
		throw error;
	}
};