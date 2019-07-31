let navbar = document.getElementById('navbar');
let content = document.getElementById('content');

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
