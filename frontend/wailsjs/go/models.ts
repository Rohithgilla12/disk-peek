export namespace scanner {
	
	export class Category {
	    id: string;
	    name: string;
	    description?: string;
	    icon: string;
	    color: string;
	    size: number;
	    itemCount: number;
	    children?: Category[];
	    selected: boolean;
	
	    static createFrom(source: any = {}) {
	        return new Category(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.name = source["name"];
	        this.description = source["description"];
	        this.icon = source["icon"];
	        this.color = source["color"];
	        this.size = source["size"];
	        this.itemCount = source["itemCount"];
	        this.children = this.convertValues(source["children"], Category);
	        this.selected = source["selected"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class CleanResult {
	    freedBytes: number;
	    deletedPaths: string[];
	    errors?: string[];
	
	    static createFrom(source: any = {}) {
	        return new CleanResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.freedBytes = source["freedBytes"];
	        this.deletedPaths = source["deletedPaths"];
	        this.errors = source["errors"];
	    }
	}
	export class FileNode {
	    name: string;
	    path: string;
	    size: number;
	    isDir: boolean;
	    // Go type: time
	    modTime?: any;
	    children?: FileNode[];
	
	    static createFrom(source: any = {}) {
	        return new FileNode(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.path = source["path"];
	        this.size = source["size"];
	        this.isDir = source["isDir"];
	        this.modTime = this.convertValues(source["modTime"], null);
	        this.children = this.convertValues(source["children"], FileNode);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class FullScanResult {
	    mode: string;
	    root?: FileNode;
	    totalSize: number;
	    scanDuration: number;
	
	    static createFrom(source: any = {}) {
	        return new FullScanResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.mode = source["mode"];
	        this.root = this.convertValues(source["root"], FileNode);
	        this.totalSize = source["totalSize"];
	        this.scanDuration = source["scanDuration"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class ScanResult {
	    mode: string;
	    categories: Category[];
	    totalSize: number;
	    scanDuration: number;
	
	    static createFrom(source: any = {}) {
	        return new ScanResult(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.mode = source["mode"];
	        this.categories = this.convertValues(source["categories"], Category);
	        this.totalSize = source["totalSize"];
	        this.scanDuration = source["scanDuration"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class NodeModulesProject {
	    path: string;
	    projectName: string;
	    size: number;
	    modTime: any;
	    packageJson: boolean;

	    static createFrom(source: any = {}) {
	        return new NodeModulesProject(source);
	    }

	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.path = source["path"];
	        this.projectName = source["projectName"];
	        this.size = source["size"];
	        this.modTime = source["modTime"];
	        this.packageJson = source["packageJson"];
	    }
	}
	export class NodeModulesResult {
	    projects: NodeModulesProject[];
	    totalSize: number;
	    totalCount: number;
	    scanDuration: number;

	    static createFrom(source: any = {}) {
	        return new NodeModulesResult(source);
	    }

	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.projects = this.convertValues(source["projects"], NodeModulesProject);
	        this.totalSize = source["totalSize"];
	        this.totalCount = source["totalCount"];
	        this.scanDuration = source["scanDuration"];
	    }

		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}

}

export namespace settings {
	export class Settings {
	    permanentDelete: boolean;
	    disabledCategories: Record<string, boolean>;

	    static createFrom(source: any = {}) {
	        return new Settings(source);
	    }

	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.permanentDelete = source["permanentDelete"];
	        this.disabledCategories = source["disabledCategories"] || {};
	    }
	}
}

export namespace cache {
	export class CacheInfo {
	    hasDevCache: boolean;
	    devTimestamp: any;
	    hasNormalCache: boolean;
	    normalTimestamp: any;

	    static createFrom(source: any = {}) {
	        return new CacheInfo(source);
	    }

	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.hasDevCache = source["hasDevCache"];
	        this.devTimestamp = source["devTimestamp"];
	        this.hasNormalCache = source["hasNormalCache"];
	        this.normalTimestamp = source["normalTimestamp"];
	    }
	}

	export class CachedDevScan {
	    result: scanner.ScanResult;
	    timestamp: any;
	    version: string;

	    static createFrom(source: any = {}) {
	        return new CachedDevScan(source);
	    }

	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.result = source["result"];
	        this.timestamp = source["timestamp"];
	        this.version = source["version"];
	    }
	}

	export class CachedNormalScan {
	    result: scanner.FullScanResult;
	    timestamp: any;
	    rootPath: string;
	    version: string;

	    static createFrom(source: any = {}) {
	        return new CachedNormalScan(source);
	    }

	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.result = source["result"];
	        this.timestamp = source["timestamp"];
	        this.rootPath = source["rootPath"];
	        this.version = source["version"];
	    }
	}
}

