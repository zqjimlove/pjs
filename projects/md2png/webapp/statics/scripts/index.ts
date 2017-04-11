declare const showdown: any;
declare const html2canvas: any;

import Render from './MarkDownRender';
import Editor from './Editor';
import * as html2canvas from '//cdn.staticfile.org/html2canvas/0.5.0-beta4/html2canvas.min.js'

function $(selector: string): Element {
    return document.querySelector(selector);
}

let editWrapEl = $('#editWrap'),
    genWrapEl = $('#genWrap'),
    mdWrapEl = <HTMLDivElement>$('#mdRenderWrap'),
    enTitleEl = <HTMLInputElement>$('#enTitle'),
    titleEl = <HTMLInputElement>$('#title'),
    nameEl = <HTMLInputElement>$('#name'),
    enNameEl = <HTMLInputElement>$('#enName'),
    genImgEl = <HTMLImageElement>$('#genImg'),
    textEl = <HTMLInputElement>$('#text'),
    mpBodyEditWrapEl = <HTMLInputElement>$('#mpBodyEditWrap'),
    // mpBodyEditer = <HTMLDivElement>$('#mpBodyEditer'),
    dlBtnEl = <HTMLLinkElement>$('#dlBtn');
nameEl.value = window.localStorage['name'] || '';
enNameEl.value = window.localStorage['enName'] || '';



class App {
    private editor: Editor;
    constructor() {
        this.editor = new Editor();
        document.body.removeChild($('#loading'))
        this.bind()
    }
    bind() {
        let that = this;
        $('#genBtn').addEventListener('click', () => {
            this.generate();
        })
        $('#genBtn2').addEventListener('click', () => {
            this.generate();
        })
        $('#previewBtn').addEventListener('click', () => {
            this.preview();
        })
    }
    preview() {
        var text = textEl.value,
            html = Render.convert(text, this.editor.getImages());
        mdWrapEl.innerHTML = createTitleElement() + html + createDate();
        document.body.className = "show-preview-wrap";
    }
    generate() {
        var text = textEl.value,
            html = Render.convert(text, this.editor.getImages());
        mdWrapEl.innerHTML = createTitleElement() + html + createDate();
        document.body.className = "show-mp-render-wrap";
        try {
            html2canvas(mdWrapEl, {
                onrendered: function (canvas) {
                    var dataURL = canvas.toDataURL('image/png');
                    genImgEl.src = dataURL;
                    dlBtnEl.href = dataURL;
                    document.body.className = "show-gen-wrap";
                },
                width: mdWrapEl.offsetWidth * 2.5,
                height: mdWrapEl.offsetHeight * 2.5,
                letterRendering: true,
                allowTaint: true,
                useCORS: true
            })
        } catch (e) {
            alert('Canvas FAIL');
        }
    }
}

new App();


function leftpad(str) {
    str = str + '';
    var pad = "00"
    return pad.substring(0, pad.length - str.length) + str
}

function createTitleElement() {
    window.localStorage['name'] = nameEl.value;
    window.localStorage['enName'] = enNameEl.value;
    var tpl = document.getElementById('titleTpl').innerHTML;
    return tpl.replace('${enTitle}', enTitleEl.value).replace('${title}', titleEl.value)
        .replace('${name}', nameEl.value).replace('${enName}', enNameEl.value);
}

function createDate() {
    let now = new Date();
    return '<div class="date">' + now.getFullYear() + '/' + leftpad(now.getMonth() + 1) + '/' + leftpad(now.getDate()) + '</div>'
}


