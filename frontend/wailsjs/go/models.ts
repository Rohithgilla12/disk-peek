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

}

export namespace updater {

	export class UpdateInfo {
		currentVersion: string;
		latestVersion: string;
		updateAvailable: boolean;
		releaseNotes: string;
		releaseUrl: string;
		downloadUrl: string;
		assetName: string;
		assetSize: number;
		publishedAt: string;

		static createFrom(source: any = {}) {
			return new UpdateInfo(source);
		}

		constructor(source: any = {}) {
			if ('string' === typeof source) source = JSON.parse(source);
			this.currentVersion = source["currentVersion"];
			this.latestVersion = source["latestVersion"];
			this.updateAvailable = source["updateAvailable"];
			this.releaseNotes = source["releaseNotes"];
			this.releaseUrl = source["releaseUrl"];
			this.downloadUrl = source["downloadUrl"];
			this.assetName = source["assetName"];
			this.assetSize = source["assetSize"];
			this.publishedAt = source["publishedAt"];
		}
	}

}

