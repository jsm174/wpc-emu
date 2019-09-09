'use strict';

// reference the webworker from wep-emu
import WebWorker from 'worker-loader!wpc-emu/lib/webclient/webworker.js';
import * as gamelist from 'wpc-emu/client/scripts/db/gamelist';
import * as WpcEmuWebWorkerApi from 'wpc-emu/lib/webclient';

import { downloadFileFromUrlAsUInt8Array } from './lib/fetcher';
import { initialiseActions } from './lib/initialise';
import { initCanvas, drawDmdShaded } from './lib/canvas';

let wpcEmuWebWorkerApi;

const DESIRED_FPS = 50;
const INITIAL_GAME = 'WPC-DMD: Hurricane';

let rafId;

function initializeEmu(gameEntry) {

  return downloadFileFromUrlAsUInt8Array(gameEntry.rom.u06)
    .then((u06Rom) => {
      console.log('Successfully loaded ROM', u06Rom.length);
      const romData = {
        u06: u06Rom,
      };
      return wpcEmuWebWorkerApi.initialiseEmulator(romData, gameEntry);
    })
    .then((emuVersion) => {
      console.log('Successfully initialized emulator', emuVersion);

      window.wpcInterface = {
        webclient: wpcEmuWebWorkerApi,
        resetEmu,
        pauseEmu,
        resumeEmu,
        writeMemory,
      };

      initCanvas();

      wpcEmuWebWorkerApi.registerAudioConsumer((message) => {
        console.log('AUDIO:', message);
      });

      wpcEmuWebWorkerApi.registerUiUpdateConsumer((emuUiState) => {
        const { emuState } = emuUiState;
        if (!emuState) {
          console.log('NO_EMU_STATE!');
          return;
        }
        if (rafId) {
          //console.log('MISSED_DRAW!', rafId, missedDraw);
          cancelAnimationFrame(rafId);
        }

        rafId = requestAnimationFrame((timestamp) => {

          if (emuState.asic.dmd.dmdShadedBuffer) {
            drawDmdShaded(emuState.asic.dmd.dmdShadedBuffer);
          }
          //console.log('wpcEmuWebWorkerApi.getStatistics()',wpcEmuWebWorkerApi.getStatistics());
/*          const { averageRTTms, sentMessages, failedMessages } = wpcEmuWebWorkerApi.getStatistics();
          emuDebugUi.drawMetaData({
            averageRTTms, sentMessages, failedMessages, missedDraw, lastFps
          });
*/
          rafId = 0;
        });

      });
    });
}

function initEmuWithGameName(name) {
  //soundInstance.stop();
  const gameEntry = gamelist.getByName(name);

  return Promise.all([ initializeEmu(gameEntry), wpcEmuWebWorkerApi.reset() ])
    .then(resumeEmu)
    .then(() => wpcEmuWebWorkerApi.adjustFramerate(DESIRED_FPS))
    .then(() => initialiseActions(gameEntry.initialise, wpcEmuWebWorkerApi))
    .catch((error) => {
      console.error('FAILED to load ROM:', error.message);
    });
}

function resumeEmu() {
  return wpcEmuWebWorkerApi.resumeEmulator();
}

function pauseEmu() {
  cancelAnimationFrame(rafId);
  rafId = undefined;
  return wpcEmuWebWorkerApi.pauseEmulator();
}

function resetEmu() {
  return wpcEmuWebWorkerApi.resetEmulator();
}

/**
 * Write directly to emulator memory
 * @param {Number} offset where to write
 * @param {Number|String} value String or uint8 value to write
 */
function writeMemory(offset, value) {
  return wpcEmuWebWorkerApi.writeMemory(offset, value);
}

function registerKeyboardListener() {
  window.addEventListener('keydown', (e) => {
    switch (e.keyCode) {
      case 49: //1
        return wpcEmuWebWorkerApi.setCabinetInput(1);

      case 50: //2
        return wpcEmuWebWorkerApi.setCabinetInput(2);

      case 51: //3
        return wpcEmuWebWorkerApi.setCabinetInput(4);

      case 52: //4
        return wpcEmuWebWorkerApi.setCabinetInput(8);

      case 53: //5
        return wpcEmuWebWorkerApi.setInput(13);

      case 55: //7
        return wpcEmuWebWorkerApi.setCabinetInput(16);

      case 56: //8
        return wpcEmuWebWorkerApi.setCabinetInput(32);

      case 57: //9
        return wpcEmuWebWorkerApi.setCabinetInput(64);

      case 48: //0
        return wpcEmuWebWorkerApi.setCabinetInput(128);

      case 80: //P
        return pauseEmu();

      case 82: //R
        return resumeEmu();
    }
  }, false);
}

console.log('INIT WPC-EMU-EXAMPLE');
if ('serviceWorker' in navigator) {
  // Use the window load event to keep the page load performant
  // NOTE: works only via SSL!
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('service-worker.js')
      .then((registration) => {
        console.log('SW registered:', registration);
      }).catch((error) => {
        console.log('SW registration failed:', error);
      });
  });
}

wpcEmuWebWorkerApi = WpcEmuWebWorkerApi.initialiseWebworkerAPI(new WebWorker());
initEmuWithGameName(INITIAL_GAME)
  .catch((error) => console.error);

registerKeyboardListener();
