let navbar = document.getElementById('navbar');
let content = document.getElementById('content');

if(navbar){
    content.style.paddingTop = navbar.offsetHeight + 20 - 0.5 + 'px';

    window.onscroll = () => {
        if(window.scrollY == 0){
            navbar.style.boxShadow = '';
        }else{
            navbar.style.boxShadow = '0 0px 8px 0 rgba(0,0,0,0.2)';
        }
    }
}
