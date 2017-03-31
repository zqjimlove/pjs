declare const showdown: any;
declare const html2canvas: any;

var converter = new showdown.Converter();
var editWrapEl = document.getElementById('editWrap');
var genWrapEl = document.getElementById('genWrap');
var mdWrapEl = document.getElementById('mdWrap');
var enTitleEl = <HTMLInputElement>document.getElementById('enTitle');
var titleEl = <HTMLInputElement>document.getElementById('title');
var nameEl = <HTMLInputElement>document.getElementById('name');
var enNameEl = <HTMLInputElement>document.getElementById('enName');
var genImgEl = <HTMLImageElement>document.getElementById('genImg');
var dlBtnEl = <HTMLLinkElement>document.getElementById('dlBtn');


nameEl.value = window.localStorage['name'] || '';
enNameEl.value = window.localStorage['enName'] || '';

function ReEdit() {
    document.body.className = "show-edit-wrap";
}
function Converter() {
    var text = (<HTMLInputElement>document.getElementById('text')).value,
        html = converter.makeHtml(text);
    mdWrapEl.innerHTML = createTitleElement() + html + createDate();
    document.body.className = "show-mp-render-wrap";


    html2canvas(mdWrapEl, {
        onrendered: function (canvas) {

            var dataURL = canvas.toDataURL('image/png');
            document.body.className = "show-gen-wrap";
            genImgEl.src = dataURL;
            dlBtnEl.href = dataURL;
            document.body.className = "show-gen-wrap";
            // window.location.href = dataURL;
            // document.body.appendChild(canvas);
        },
        width: mdWrapEl.offsetWidth * 2.5,
        height: mdWrapEl.offsetHeight * 2.5,
        letterRendering: true
    })
}

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