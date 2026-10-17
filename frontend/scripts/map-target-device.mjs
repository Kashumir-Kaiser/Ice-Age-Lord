const softwareRenderer=/swiftshader|llvmpipe|softpipe|lavapipe|software|basic render|\bwarp\b/i;

export function benchmarkHeadlessMode(value){
 return value!=='false';
}

export function selectWebGLAdapterInfo({unmaskedVendor,unmaskedRenderer,maskedVendor,maskedRenderer}={}){
 const text=value=>typeof value==='string'&&value?value:null;
 const vendor=text(unmaskedVendor)??text(maskedVendor),renderer=text(unmaskedRenderer)??text(maskedRenderer);
 return {vendor,renderer,vendorSource:text(unmaskedVendor)?'unmasked':'masked',rendererSource:text(unmaskedRenderer)?'unmasked':'masked'};
}

export function isVerifiedIntelUhd620({headless=true,vendor='',renderer=''}={}){
 const adapter=`${vendor} ${renderer}`;
 return headless===false&&/intel/i.test(adapter)&&/uhd\s*graphics\s*620/i.test(renderer)&&!softwareRenderer.test(adapter);
}
