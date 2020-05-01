let CURRENT_SONG;

const startListening = () => {
  // get initial visualizer
  fetchCurrentlyPlaying();

  const player = document.querySelector('.now-playing-bar__left');

  var config = { attributes: true, childList: true, subtree: true };

  const callback = (mutationsList, observer) => {
    for (let mutation of mutationsList) {
      if (mutation.type === 'attributes' && mutation.target.nodeName === 'A') {
        fetchCurrentlyPlaying();
      }
    }
  };

  // Create an observer instance linked to the callback function
  var observer = new MutationObserver(callback);

  // Start observing the target node for configured mutations
  observer.observe(player, config);
};

const fetchCurrentlyPlaying = () => {
  const nowPlaying = $('.now-playing').first();
  const textSpans = nowPlaying.find('span[draggable="true"]').toArray();
  const imageUrl = nowPlaying.find('.cover-art-image').first().attr('src');

  // TODO: Error handle
  if (textSpans.length < 1) return;

  const title = textSpans.shift().textContent;
  const artist = textSpans.map((a) => a.textContent).join(', ');
  const id = `${title}:${artist}`;

  const newSong = {
    title,
    artist,
    imageUrl,
    id,
  };

  // check to see if different song
  if (!CURRENT_SONG || CURRENT_SONG.id !== newSong.id) {
    CURRENT_SONG = newSong;
    updateVisualizer();
  }
};

const updateVisualizer = () => {
  const { imageUrl, title, artist } = CURRENT_SONG;

  // preload image so the visualizer doesn't lag
  const preloadedImage = new Image();
  preloadedImage.src = imageUrl;

  preloadedImage.onload = function () {
    // render html for visualizer
    $('#visualizer').html(`
    <button id="close-btn">
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-x"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
    </button>

    <img src="${imageUrl}" class="visualizer-img"></img>

    <h1 class="visualizer-text">${title}</h1>
    <h3 class="visualizer-text">${artist}</h3>
  `);

    // add event listeners for close
    $('#close-btn').click(closeVisualizer);
  };
};

const closeVisualizer = (e) => {
  $('#visualizer').css('display', 'none');
  $('.now-playing-bar__center').removeClass('visualizer-player');
};

const openVisualizer = (e) => {
  if (CURRENT_SONG) {
    $('#visualizer').css('display', 'flex');

    // append play controls
    $('.now-playing-bar__center').addClass('visualizer-player');

    // inactive cursor logic
    inactiveMouseCursor();
  }
};

const inactiveMouseCursor = () => {
  let timer;
  let fadeInBuffer = false;

  $(document).mousemove(() => {
    if (!fadeInBuffer) {
      if (timer) {
        clearTimeout(timer);
        timer = 0;
      }

      $('html').css({
        cursor: '',
      });
    } else {
      $('#visualizer').css({
        cursor: 'default',
      });
      fadeInBuffer = false;
    }

    timer = setTimeout(() => {
      $('#visualizer').css({
        cursor: 'none',
      });

      fadeInBuffer = true;
    }, 2000);
  });
  $('#visualizer').css({
    cursor: 'default',
  });
};

chrome.extension.sendMessage({}, (response) => {
  const readyStateCheckInterval = setInterval(() => {
    if (document.readyState === 'complete' && $('.now-playing').length) {
      clearInterval(readyStateCheckInterval);

      // append visualizer
      $('body').append(`<div id="visualizer"></div>`);

      // start mutation observer for currently playing
      startListening();

      // add icon to controls
      $('.ExtraControls').prepend(`
          <div class="GlueDropTarget">
          <button id="show-visualizer">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-maximize-2"><polyline points="15 3 21 3 21 9"></polyline><polyline points="9 21 3 21 3 15"></polyline><line x1="21" y1="3" x2="14" y2="10"></line><line x1="3" y1="21" x2="10" y2="14"></line></svg>
          </button>
          </div>
      `);

      // add event listener to open
      $('#show-visualizer').click(openVisualizer);
    }
  }, 10);
});
