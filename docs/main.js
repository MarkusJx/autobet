// Add a scroll listener to fade in a colored background
// when the page is scrolled down.
// Source: https://webdesign.tutsplus.com/tutorials/simple-fade-effect-on-scroll--cms-35166
{
    // The checkpoint value.
    // Controls how fast the background fades in.
    // The higher the value, the faster the background fades in.
    const checkpoint = document.body.clientHeight / 6;

    // The offset when the background should start to fade in
    const scroll_offset = document.body.clientHeight / 6;

    // The background element
    const background = document.getElementById('background');

    window.addEventListener("scroll", () => {
        {
            // Subtract the scroll offset from the actuall scroll value
            const currentScroll = window.pageYOffset - scroll_offset;
            if (currentScroll <= checkpoint) {
                // If the currentScroll value is less than or equal to zero,
                // set the opacity to zero. This is to enforce the scroll offset.
                if (currentScroll <= 0) {
                    opacity = 0;
                } else {
                    opacity = currentScroll / checkpoint;
                }
            } else {
                opacity = 1;
            }

            // Set the actual opacity
            background.style.opacity = opacity;
        }

        /*{
            const check = 3500;
            const thresh = 80 / check;
            const currentScroll = Math.max(window.pageYOffset - document.body.clientHeight * 1.6, 0);
            console.log(currentScroll);
            if (currentScroll <= document.body.clientHeight) {
                document.getElementById('ui-text').style.top = currentScroll * thresh - 80 + "vh";
            }
        }*/
    });
}

{
    // The time between the different words fade in. In milliseconds.
    const time_between_fade_ins = 150;

    const elements = document.getElementsByClassName('welcome-text-font');
    for (let i = 0; i < elements.length; i++) {
        // Fade in each word of the welcome text
        // word by word, with a delay of time_between_fade_ins
        setTimeout(() => {
            elements[i].classList.add("faded-in");
        }, (i + 1) * time_between_fade_ins);
    }

    setTimeout(() => {
        document.getElementById('welcome-repo-name-container').classList.add("faded-in");
    }, (elements.length + 5) * time_between_fade_ins);

    // Animate the 'scroll down' arrow and make the page scrollable
    setTimeout(() => {
        document.getElementById('arrow-scroll-down').classList.add("faded-in");
        setTimeout(() => {
            document.getElementById('arrow-scroll-down').classList.add("animated");
            document.body.classList.add("scrollable");
        }, time_between_fade_ins * 3);
    }, (elements.length + 8) * time_between_fade_ins);

    // If the page is already scrolled down,
    // make the page scrollable
    if (window.pageYOffset > 0) {
        document.body.classList.add("scrollable");
    }
}
