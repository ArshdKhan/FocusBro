function handleClick() {
    alert('Button clicked!');
}

document.addEventListener('DOMContentLoaded', function() {
    const button = document.querySelector('.button');
    button.addEventListener('click', handleClick);
});