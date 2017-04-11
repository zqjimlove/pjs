import * as showdown from '//cdn.staticfile.org/showdown/1.6.4/showdown.min.js';





let RenderImages,
    renderImagesRegex = /md2png\:\/\/files\.(.*?)\.png/;

function createExts() {
    let ImageLineExt = {
        type: 'output',
        regex: /<p>\s+<img/g,
        replace: '<p class="p_img"><img'
    },
        ImageRenderExt = {
            type: 'lang',
            regex: /\!\[.*?\]\(md2png\:\/\/files\.(.*?)\.png\)/g,
            replace: function (_, index) {
                return RenderImages[index] ? `\r![](${RenderImages[index]})\r` : '!!!图片已失效';
            }
        };
    return [ImageLineExt, ImageRenderExt];
}

showdown.extension('MyExts', createExts);

export default class Render {
    converter: any;
    static INSTANCE: Render;
    constructor() {
        if (Render.INSTANCE) {
            this.converter = Render.INSTANCE;
        } else {
            Render.INSTANCE = this.converter = new showdown.Converter({ extensions: ['MyExts'] });
        }
    }
    makeHtml(s) {
        return this.converter.makeHtml(s);
    }
    static convert(s: String, images: any) {
        RenderImages = images;
        let render = Render.INSTANCE;
        if (!render) {
            render = new Render();
        }
        return render.makeHtml(s)
    }
}