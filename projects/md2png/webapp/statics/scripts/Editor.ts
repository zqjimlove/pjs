function $(selector: string): Element {
    return document.querySelector(selector);
}


let mpBodyEditWrapEl = <HTMLInputElement>$('#mpBodyEditWrap'),
    formWrapEl = <HTMLInputElement>$('#formWrap'),
    inserImageEl = <HTMLInputElement>$('#inserImage'),
    editToolbarEl = <HTMLInputElement>$('#editToolbar'),
    editdoneEl = <HTMLInputElement>$('#editdone'),
    textEl = <HTMLInputElement>$('#text');

export default class Editor {
    private isEditing = false;
    private isFocus = false;
    private files = [];
    private imagesDatas = {};
    constructor() {
        this.bindEvent();
    }
    public getImages() {
        return this.imagesDatas;
    }
    bindEvent() {
        let that = this;
        textEl.addEventListener('focus', function (e: Event) {
            if (!that.isEditing) {
                // e.preventDefault();
                // e.stopPropagation();
                document.body.className = 'show-mp-body-edit-wrap';
                mpBodyEditWrapEl.appendChild(this);
                that.isEditing = true;
                this.focus();
            }
        });
        inserImageEl.addEventListener('change', function (e: Event) {
            if (this.files && this.files[0]) {
                that.files.push(this.files[0]);
                let appendValue = `![](md2png://files.${that.files.length - 1}.png)`;
                if (textEl.selectionStart || textEl.selectionStart === 0) {
                    var startPos = textEl.selectionStart;
                    var endPos = textEl.selectionEnd;
                    textEl.value = textEl.value.substring(0, startPos)
                        + appendValue
                        + textEl.value.substring(endPos, textEl.value.length);
                } else {
                    textEl.value += appendValue;
                }
            }
            setTimeout(() => {
                that.renderImageBase64Data()
            }, 0)
        });

        editdoneEl.addEventListener('click', function (e: Event) {
            document.body.className = 'show-edit-wrap';
            formWrapEl.appendChild(textEl);
            that.isEditing = false;
        })
    }
    renderImageBase64Data() {
        let that = this

        this.files.forEach((e, i) => {
            if (this.imagesDatas[i]) return;
            var reader = new FileReader();
            reader.onload = function (e: any) {
                that.imagesDatas[i] = (e.target.result);
            }
            reader.readAsDataURL(e);
        });
    }
}