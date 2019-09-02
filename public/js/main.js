let navbar = document.getElementById('navbar');
let content = document.getElementById('content');

Array.prototype.pushToIndex = function(val, i){
    this.splice(i, 0, val);
}
Array.prototype.pushSorted = function(val){
    let i = sortedIndex(this, val);
    this.pushToIndex(val, i);

    return i + 1;
}

Element.prototype.remove = function() {
    this.parentElement.removeChild(this);
}

if(window.innerWidth < 932){
    $('#nav-logo-text').hide();
}else if(window.innerWidth < 1000){
    $('#nav-logo-text').find('p').hide();
}

$('time.timeago').timeago();

$('.size-after').each((i, val) => {
    let after = $(val);
    let ratio = after.height()/after.width();
    let height = after.next().height();

    after.height(height);
    after.width(height/ratio);
});

$(window).keydown(function(event){
    if(event.keyCode == 13) {
        event.preventDefault();
        return false;
    }
});

let checks = $('input[type=checkbox]');

checks.each((i, val) => {
    setUpCheckBox($(val));
});

checks.on('change',  function(){
    setUpCheckBox($(this));
});

if(navbar){
    content.style.paddingTop = navbar.offsetHeight - 0.5 + 'px';

    window.onscroll = () => {
        if(window.scrollY == 0){
            navbar.style.boxShadow = '';
        }else{
            navbar.style.boxShadow = '0 0px 8px 0 rgba(0,0,0,0.2)';
        }
    }
}

function toggle(id1, id2){
    let div1 = document.getElementById(id1);
    let div2 = document.getElementById(id2);

    let temp = div1.style.display;
    div1.style.display = div2.style.display;
    div2.style.display = temp;
}

function toggleArr(ids1, ids2){
    let temp = document.getElementById(ids1[0]).style.display;
    for(let i = 0; i < ids1.length; i++){
        document.getElementById(ids1[i]).style.display = document.getElementById(ids2[0]).style.display;
    }
    for(let i = 0; i < ids2.length; i++){
        document.getElementById(ids2[i]).style.display = temp;
    }
}

function openDiv(id, display){
    let div = document.getElementById(id);

    div.style.display = div.style.display == 'none' ? (display || 'block') : 'none';
}

function toggleEdit(editId, id1, id2, display){
    if(id1 && id2){
        toggle(id1, id2);
    }

    let edit = document.getElementById(editId);
    edit.style.display = display || 'block';
}

function cancelEdit(){
    location.reload();
}

function clean(str){
    return str.trim().toLowerCase();
}

function setUpCheckBox(self){
    if(self.is(':checked')){
        self.attr('value', 'true');
    }else{
        self.attr('value', 'false');
    }
}

function submitForm(id){
    $(`form#${id}`).submit();
}

function sortedIndex(array, value) {
    var low = 0,
        high = array.length;

    while (low < high) {
        var mid = (low + high) >>> 1;
        if (array[mid] < value) low = mid + 1;
        else high = mid;
    }

    return low;
}

function previewCreate(input, media){
    previewImage(input, e => {
        $(`#${media}`).append(`
            <div class="media" style="vertical-align: middle; height: 45px; display: inline-block; margin-right: 10px">
                <img src="${e.target.result}" style="vertical-align: middle; height: 45px">
            </div>
        `);
    });
}

function previewUpdate(input, media){
    previewImage(input, e => {
        $(`#${media}`).css({'background': `url(${e.target.result})`, 'background-size': 'cover', 'background-position': 'center'});
    });
}

function previewMedia(input, media){
    $(`#${media}`).html('');

    previewImage(input, e => {
        let type = e.target.result.split('data:')[1].split('/')[0];
        let html = type == 'image' ?
            `<img src="${e.target.result}">` :
            `<video controls><source src="${e.target.result}"></video>`;

        $(`#${media}`).append(`
            <div class="media-container">
                ${html}
            </div>
        `);
    });
}

function previewImage(input, cb){
    let i = document.getElementById(input);

    if(i.files && i.files[0]){

        for(let k = 0; k < i.files.length; k++){
            let reader = new FileReader();

            reader.onload = function(e){
                cb(e);
            };

            reader.readAsDataURL(i.files[k]);
        }
    }
}
