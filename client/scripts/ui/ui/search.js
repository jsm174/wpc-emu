'use strict';

export { findString, findUint8, findUint16, findUint32, findIdenticalOffsetInArray };

const MAX_ELEMENTS_TO_SEARCH = 64;

function findString(stringToSearch, uint8Array) {
  const result = [];
  const searchString = stringToSearch
    .split('')
    .map((char) => char.charCodeAt(0));

  const maxIndex = uint8Array.length - stringToSearch.length;
  let index = -1;
  for (const char of uint8Array) {
    index++;
    if (index > maxIndex) {
      return result;
    }
    if (char === searchString[0]) {
      if (_findString(searchString, index, uint8Array)) {
        result.push(index);
        if (result.length > MAX_ELEMENTS_TO_SEARCH) {
          return result;
        }
      }
    }
  };
  return result;
}

function _findString(searchString, startPos, uint8Array) {
  for (let j = 1; j < searchString.length; j++) {
    if (uint8Array[startPos + j] !== searchString[j]) {
      return false;
    }
  }
  return true;
}

function findUint32(uint32ToSearch, uint8Array) {
  const result = [];
  const searchUint32 = uint32ToSearch & 0xFFFFFFFF;
  const dataView = new DataView(uint8Array.buffer);
  for (let offset = 0; offset < (uint8Array.length - 3); offset++) {
    if (dataView.getUint32(offset) === searchUint32) {
      result.push(offset);
      if (result.length > MAX_ELEMENTS_TO_SEARCH) {
        return result;
      }
    }
  }
  return result;
}

function findUint16(uint16ToSearch, uint8Array) {
  const result = [];
  const searchUint16 = uint16ToSearch & 0xFFFF;
  const dataView = new DataView(uint8Array.buffer);
  for (let offset = 0; offset < (uint8Array.length - 1); offset++) {
    if (dataView.getUint16(offset) === searchUint16) {
      result.push(offset);
      if (result.length > MAX_ELEMENTS_TO_SEARCH) {
        return result;
      }
    }
  }
  return result;
}

function findUint8(uint8ToSearch, uint8Array) {
  const result = [];
  const searchUint8 = uint8ToSearch & 0xFF;
  let index = -1;
  for (const char of uint8Array) {
    index++;
    if (char === searchUint8) {
      result.push(index);
      if (result.length > MAX_ELEMENTS_TO_SEARCH) {
        return result;
      }
    }
  };
  return result;
}

function findIdenticalOffsetInArray(uint8Array1, uint8Array2) {
  if (!uint8Array1 || !uint8Array2) {
    return new Uint8Array();
  }
  return uint8Array1.filter((offset) => {
    return uint8Array2.indexOf(offset) !== -1;
  });
}