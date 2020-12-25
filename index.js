'use strict';

const title = document.getElementById('title');
const body = document.getElementById('body');
const list = document.getElementById('list');

const saveButton = document.getElementById('save');
saveButton.addEventListener('click', save);

const databaseName = 'memo';
const storeName = 'memoes';

let database = null;

window.onload = () => {
  if (!window.indexedDB) {
    window.alert('ご利用のブラウザでは IndexedDB がサポートされていません');
    console.warn('IndexedDB はサポートされていません');
  }

  const openRequest = indexedDB.open(databaseName, 1);

  openRequest.onupgradeneeded = event => {
    database = event.target.result;
    database.createObjectStore(storeName, { keyPath: 'id', autoIncrement: true });

    // インデックスを使用する
    // const objectStore = database.createObjectStore(storeName, { keyPath: 'id', autoIncrement: true });
    // objectStore.createIndex('title', 'title', { unique: false });
    // objectStore.createIndex('body', 'body', { unique: false });
    // objectStore.createIndex('writeDate', 'writeDate', { unique: false });
  }

  openRequest.onsuccess = event => {
    database = event.target.result;
    console.info('データベースへの接続に成功しました');

    database.onerror = e => {
      console.error(`Database Error: ${e.target.errorCode}`);
    }

    // 保存されているデータをリストに表示する
    const transaction = database.transaction(storeName, 'readonly');
    const objectStore = transaction.objectStore(storeName);

    const cursorRequest = objectStore.openCursor(null, 'next');
    cursorRequest.onsuccess = e => {
      const cursor = e.target.result;
      if (cursor === null) return;
      output(cursor.value.id);
      cursor.advance(1);
    }
  }

  openRequest.onerror = event => {
    alert('データベースへの接続に失敗しました');
    console.error('データベースへの接続に失敗しました');
  }
}

/**
 * データベースにデータを追加する
 */
function save() {
  if (title.value.length === 0 || body.value.length === 0) {
    alert('タイトルまたはテキストが入力されていません');
    title.value = null;
    body.value = null;
    return;
  }

  const memo = {
    title: title.value,
    body: body.value,
    writeDate: new Date().toLocaleString()
  };

  title.value = null;
  body.value = null;

  const transaction = database.transaction(storeName, 'readwrite');
  const objectStore = transaction.objectStore(storeName);
  const addRequest = objectStore.add(memo);

  let id = null;

  addRequest.onsuccess = event => {
    id = event.target.result;
    output(id);
  }

  transaction.oncomplete = () => {
    console.info('データの保存処理が正常に完了しました', `ID: ${id}`);
  }
}

/**
 * 引数に指定した ID を持つレコードをリストに表示する
 * @param {string | number} id keyPath
 */
function output(id) {
  const transaction = database.transaction(storeName, 'readonly');
  const objectStore = transaction.objectStore(storeName);
  const getRequest = objectStore.get(id);

  getRequest.onsuccess = event => {
    const memo = event.target.result;

    const card = document.createElement('div');
    const cardHeader = document.createElement('div');
    const cardBody = document.createElement('div');
    const cardFooter = document.createElement('div');
    const cardTitle = document.createElement('h5');
    const cardText = document.createElement('p');
    const button = document.createElement('button');

    card.classList.add('card', 'my-3');
    cardHeader.classList.add('card-header');
    cardBody.classList.add('card-body');
    cardFooter.classList.add('card-footer', 'text-muted');
    cardTitle.classList.add('card-title');
    cardText.classList.add('card-text');
    button.classList.add('btn', 'btn-danger', 'float-right');

    card.dataset.id = id;
    button.setAttribute('onclick', `del(${id})`);

    cardHeader.innerText = `ID: ${id}`;
    cardTitle.innerText = memo.title;
    cardText.innerText = memo.body;
    cardFooter.innerText = memo.writeDate;
    button.innerText = '削除';

    cardBody.appendChild(cardTitle);
    cardBody.appendChild(cardText);
    cardFooter.appendChild(button);

    card.appendChild(cardHeader);
    card.appendChild(cardBody);
    card.appendChild(cardFooter);
    list.insertBefore(card, list.firstChild);
  }

  transaction.oncomplete = () => {
    console.info('データの取得処理が正常に完了しました', `ID: ${id}`);
  }
}

/**
 * 引数に指定した ID を持つレコードを削除する
 * @param {string | number} id keyPath
 */
function del(id) {
  const transaction = database.transaction(storeName, 'readwrite');
  const objectStore = transaction.objectStore(storeName);
  const deleteRequest = objectStore.delete(id);

  deleteRequest.onsuccess = event => {
    const item = document.querySelector(`div[data-id="${id}"]`);
    item ? item.remove() : console.warn(`ID: ${id} に一致する要素はありません`);
  }

  transaction.oncomplete = () => {
    console.info('データの削除処理が正常に完了しました', `ID: ${id}`);
  }
}