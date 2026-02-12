import sharp from "sharp";

export async function addWatermark(buffer:Buffer,text:string,position:"top-left" | "top-right" | "bottom-left" | "bottom-right" | "center" = "center") {

    const metadata = await sharp(buffer).metadata();
    const width = metadata.width || 800;
    const height = metadata.height || 600;
  
    // Dynamic font size based on image size
    const fontSize = Math.floor(width / 15);
  
    const watermarkSvg = Buffer.from(`
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style="stop-color:white;stop-opacity:0.3" />
            <stop offset="100%" style="stop-color:white;stop-opacity:0.1" />
          </linearGradient>
        </defs>
        <text x="50%" y="50%" 
          font-size="${fontSize}" 
          fill="url(#grad)"
          text-anchor="middle"
          dominant-baseline="middle"
          font-family="Arial"
          font-weight="bold"
          letter-spacing="2">
          © ${text}
        </text>
      </svg>
    `);
  
    const gravityMap = {
      top: "north",
      center: "center",
      bottom: "south"
    };
  
    const processed = await sharp(buffer)
      .webp({ quality: 70 })
      .composite([
        {
          input: watermarkSvg,
          gravity: gravityMap[position as keyof typeof gravityMap],
        }
      ])
      .toBuffer();
  
    return processed;

}