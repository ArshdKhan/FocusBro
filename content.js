document.addEventListener('DOMContentLoaded', () => {
    const removeYouTubeRecommendations = () => {
        const related = document.querySelector('#related');
        const comments = document.querySelector('#comments');

        if (related) {
            related.remove();
        }

        if (comments) {
            comments.remove();
        }
    };

    removeYouTubeRecommendations();

    const observer = new MutationObserver(removeYouTubeRecommendations);
    observer.observe(document.body, { childList: true, subtree: true });
});
