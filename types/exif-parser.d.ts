declare module "exif-parser" {
  interface ExifParser {
    parse: () => {
      tags: { [key: string]: any };
      imageSize?: { width: number; height: number };
    };
  }

  namespace ExifParser {
    function create(buffer: Buffer): ExifParser;
  }

  export default ExifParser;
}
