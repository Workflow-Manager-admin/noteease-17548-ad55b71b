import './style.css';

// PUBLIC_INTERFACE
import { NoteEaseMain } from './NoteEaseMain.js';

// Mount the NoteEase app to #app
const el = document.querySelector('#app');
el.innerHTML = '';
new NoteEaseMain(el);

