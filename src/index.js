/**
 * Copyright 2021 Google Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * Router, Connection utils.
 */
import Router from './js/classes/Router';
import VideoDownloaderRegistry from './js/classes/VideoDownloaderRegistry';
import ConnectionStatus from './js/classes/ConnectionStatus';
import api from '../public/api.json';

/**
 * Web Components implementation.
 */
import VideoPlayer from './js/web-components/video-player/VideoPlayer';
import VideoCard from './js/web-components/video-card/VideoCard';
import VideoDownloader from './js/web-components/video-download/VideoDownloader';
import VideoGrid from './js/web-components/video-grid/VideoGrid';
import ToggleButton from './js/web-components/toggle-button/ToggleButton';
import OfflineToggleButton from './js/web-components/offline-toggle-button/OfflineToggleButton';

/**
 * Pages.
 */
import HomePage from './js/pages/Home';
import VideoPage from './js/pages/Video';
import CategoryPage from './js/pages/Category';
import DownloadsPage from './js/pages/Downloads';
import SettingsPage from './js/pages/Settings';
import ErrorPage from './js/pages/Error';

/**
 * Settings
 */
import { loadSetting } from './js/utils/settings';
import { SETTING_KEY_TOGGLE_OFFLINE, SETTING_KEY_DARK_MODE } from './js/constants';

/**
 * Custom Elements definition.
 */
customElements.define('video-player', VideoPlayer);
customElements.define('video-card', VideoCard);
customElements.define('video-downloader', VideoDownloader);
customElements.define('video-grid', VideoGrid);
customElements.define('toggle-button', ToggleButton);
customElements.define('offline-toggle-button', OfflineToggleButton);

/**
 * Forced dark mode logic.
 */
const darkModeForced = loadSetting(SETTING_KEY_DARK_MODE) || false;
const dakrModeChangeHandler = (isDarkMode) => {
  if (isDarkMode) {
    document.documentElement.classList.add('dark-mode');
  } else {
    document.documentElement.classList.remove('dark-mode');
  }
};
window.addEventListener('setting-change', (e) => {
  if (e.detail?.setting === SETTING_KEY_DARK_MODE) dakrModeChangeHandler(e.detail.value);
});
dakrModeChangeHandler(darkModeForced);

/**
 * Tracks the connection status of the application and broadcasts
 * when the connections status changes.
 */
const offlineForced = loadSetting(SETTING_KEY_TOGGLE_OFFLINE) || false;
const connectionStatus = new ConnectionStatus(offlineForced);
const offlineBanner = document.querySelector('#offline-banner');

/**
 * Allow the page styling to respond to the global connection status.
 *
 * If an alert is emitted, slide in the "Not connected" message to inform
 * the user the action they attempted can't be performed right now.
 */
connectionStatus.subscribe(
  ({ navigatorStatus, alert }) => {
    document.body.dataset.connection = navigatorStatus;

    if (alert && navigatorStatus === 'offline') {
      offlineBanner.classList.add('alert');
      setTimeout(() => offlineBanner.classList.remove('alert'), 600);
    }
  },
);

/**
 * Bind the offline toggle(s) to the `ConnectionStatus` instance.
 */
[...document.querySelectorAll('offline-toggle-button')].forEach(
  (button) => button.assignConnectionStatus(connectionStatus),
);

/**
 * Initialize a registry holding instances of the `VideoDownload` web components.
 *
 * This is to allow us to share these instances between pages.
 */
const videoDownloaderRegistry = new VideoDownloaderRegistry({ connectionStatus });

/**
 * Router setup.
 */
const router = new Router({
  videoDownloaderRegistry,
  connectionStatus,
});
router.route('^/?$', HomePage);
router.route('^/downloads/$', DownloadsPage);
router.route('^/settings/$', SettingsPage);

/**
 * Add the category pages.
 */
api.categories.forEach((category) => router.route(`^/category/${category.slug}/$`, CategoryPage));

/**
 * Add the video pages.
 */
api.videos.forEach((video) => router.route(`^/${video.id}/$`, VideoPage));

/**
 * Consider all else an error.
 */
router.route('.*', ErrorPage);

/**
 * Register Service Worker.
 */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js');
  });
}
