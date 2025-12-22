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

	// Phase 4: Large File Finder
	export class LargeFile {
	    path: string;
	    name: string;
	    size: number;
	    modTime: any;
	    isDir: boolean;

	    static createFrom(source: any = {}) {
	        return new LargeFile(source);
	    }

	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.path = source["path"];
	        this.name = source["name"];
	        this.size = source["size"];
	        this.modTime = source["modTime"];
	        this.isDir = source["isDir"];
	    }
	}

	export class LargeFilesResult {
	    files: LargeFile[];
	    totalSize: number;
	    totalCount: number;
	    scanDuration: number;
	    threshold: number;

	    static createFrom(source: any = {}) {
	        return new LargeFilesResult(source);
	    }

	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.files = this.convertValues(source["files"], LargeFile);
	        this.totalSize = source["totalSize"];
	        this.totalCount = source["totalCount"];
	        this.scanDuration = source["scanDuration"];
	        this.threshold = source["threshold"];
	    }

		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) { return a; }
		    if (a.slice && a.map) { return (a as any[]).map(elem => this.convertValues(elem, classs)); }
		    if ("object" === typeof a) { return asMap ? Object.fromEntries(Object.entries(a).map(([k, v]) => [k, new classs(v)])) : new classs(a); }
		    return a;
		}
	}

	// Phase 4: Duplicate File Detection
	export class DuplicateFile {
	    path: string;
	    name: string;
	    size: number;
	    modTime: any;
	    hash: string;

	    static createFrom(source: any = {}) {
	        return new DuplicateFile(source);
	    }

	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.path = source["path"];
	        this.name = source["name"];
	        this.size = source["size"];
	        this.modTime = source["modTime"];
	        this.hash = source["hash"];
	    }
	}

	export class DuplicateGroup {
	    hash: string;
	    size: number;
	    files: DuplicateFile[];
	    wastedSize: number;

	    static createFrom(source: any = {}) {
	        return new DuplicateGroup(source);
	    }

	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.hash = source["hash"];
	        this.size = source["size"];
	        this.files = this.convertValues(source["files"], DuplicateFile);
	        this.wastedSize = source["wastedSize"];
	    }

		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) { return a; }
		    if (a.slice && a.map) { return (a as any[]).map(elem => this.convertValues(elem, classs)); }
		    if ("object" === typeof a) { return asMap ? Object.fromEntries(Object.entries(a).map(([k, v]) => [k, new classs(v)])) : new classs(a); }
		    return a;
		}
	}

	export class DuplicatesResult {
	    groups: DuplicateGroup[];
	    totalWasted: number;
	    totalFiles: number;
	    totalGroups: number;
	    scanDuration: number;

	    static createFrom(source: any = {}) {
	        return new DuplicatesResult(source);
	    }

	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.groups = this.convertValues(source["groups"], DuplicateGroup);
	        this.totalWasted = source["totalWasted"];
	        this.totalFiles = source["totalFiles"];
	        this.totalGroups = source["totalGroups"];
	        this.scanDuration = source["scanDuration"];
	    }

		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) { return a; }
		    if (a.slice && a.map) { return (a as any[]).map(elem => this.convertValues(elem, classs)); }
		    if ("object" === typeof a) { return asMap ? Object.fromEntries(Object.entries(a).map(([k, v]) => [k, new classs(v)])) : new classs(a); }
		    return a;
		}
	}

	// Phase 4: Disk Usage Trends
	export class TrendDataPoint {
	    timestamp: any;
	    size: number;

	    static createFrom(source: any = {}) {
	        return new TrendDataPoint(source);
	    }

	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.timestamp = source["timestamp"];
	        this.size = source["size"];
	    }
	}

	export class DiskUsageTrend {
	    categoryId: string;
	    categoryName: string;
	    dataPoints: TrendDataPoint[];
	    growthRate: number;
	    totalChange: number;

	    static createFrom(source: any = {}) {
	        return new DiskUsageTrend(source);
	    }

	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.categoryId = source["categoryId"];
	        this.categoryName = source["categoryName"];
	        this.dataPoints = this.convertValues(source["dataPoints"], TrendDataPoint);
	        this.growthRate = source["growthRate"];
	        this.totalChange = source["totalChange"];
	    }

		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) { return a; }
		    if (a.slice && a.map) { return (a as any[]).map(elem => this.convertValues(elem, classs)); }
		    if ("object" === typeof a) { return asMap ? Object.fromEntries(Object.entries(a).map(([k, v]) => [k, new classs(v)])) : new classs(a); }
		    return a;
		}
	}

	export class DiskUsageSnapshot {
	    timestamp: any;
	    totalSize: number;
	    categories: Record<string, number>;

	    static createFrom(source: any = {}) {
	        return new DiskUsageSnapshot(source);
	    }

	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.timestamp = source["timestamp"];
	        this.totalSize = source["totalSize"];
	        this.categories = source["categories"] || {};
	    }
	}

	export class TrendsResult {
	    snapshots: DiskUsageSnapshot[];
	    categoryTrends: DiskUsageTrend[];
	    totalTrend: DiskUsageTrend;
	    oldestSnapshot: any;
	    newestSnapshot: any;

	    static createFrom(source: any = {}) {
	        return new TrendsResult(source);
	    }

	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.snapshots = this.convertValues(source["snapshots"], DiskUsageSnapshot);
	        this.categoryTrends = this.convertValues(source["categoryTrends"], DiskUsageTrend);
	        this.totalTrend = source["totalTrend"];
	        this.oldestSnapshot = source["oldestSnapshot"];
	        this.newestSnapshot = source["newestSnapshot"];
	    }

		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) { return a; }
		    if (a.slice && a.map) { return (a as any[]).map(elem => this.convertValues(elem, classs)); }
		    if ("object" === typeof a) { return asMap ? Object.fromEntries(Object.entries(a).map(([k, v]) => [k, new classs(v)])) : new classs(a); }
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

