export type PlantSpec={slug:string;commonName:string;scientificName:string;form:string;matureHeightM:number;crownShape:string;crownWidthRatio:number;leafShape:string;leafSizeCm:number;branchAngle?:number;branchTaper?:number;barkColor?:string;summerColor:string;springColor?:string;autumnColor?:string;winterColor?:string;evergreen?:boolean;hasFlowers:boolean;flowerColor?:string|null;flowerSeason?:string|null;hasFruit?:boolean;fruitColor?:string;fruitSeason?:string;[key:string]:unknown};
export type Season='spring'|'summer'|'autumn'|'winter';
export type MeshData={positions:Float32Array;normals:Float32Array;uvs:Float32Array;indices:Uint32Array};
export type PlantGeometry={wood:MeshData;blades:MeshData;flowers:MeshData;fruit:MeshData;leaves:Float32Array;silhouette:MeshData;seed:number;lod:number;height:number;spread:number;nodes:number;leafCount:number;generationMs:number;pipeError:number};
export type GenerationRequest={spec:PlantSpec;seed:number;lod:0|1|2;leafLimit?:number};
