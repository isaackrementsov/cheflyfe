let navbar = document.getElementById('navbar');
let content = document.getElementById('content');

Element.prototype.remove = function() {
    this.parentElement.removeChild(this);
}

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

$(window).keydown(function(event){
    if(event.keyCode == 13) {
        event.preventDefault();
        return false;
    }
});
