const videoSection = document.getElementById('video');
const videoGrid = document.getElementById('videoGrid');
const videoNavLink = document.getElementById('videoNavLink');

if (videoSection && videoGrid && typeof VIDEOS !== 'undefined' && Array.isArray(VIDEOS) && VIDEOS.length > 0) {
  videoSection.hidden = false;
  if (videoNavLink) videoNavLink.hidden = false;

  VIDEOS.forEach(video => {
    const figure = document.createElement('figure');
    let media;

    if (video.youtube) {
      media = document.createElement('iframe');
      media.src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(video.youtube)}`;
      media.title = video.title;
      media.allowFullscreen = true;
      media.loading = 'lazy';
    } else {
      media = document.createElement('video');
      media.controls = true;
      media.preload = 'metadata';
      media.playsInline = true;
      if (video.poster) media.poster = video.poster;

      const source = document.createElement('source');
      source.src = video.file;
      source.type = 'video/mp4';
      media.append(source);
    }

    const caption = document.createElement('figcaption');
    caption.textContent = video.title;
    figure.append(media, caption);
    videoGrid.append(figure);
  });
}
