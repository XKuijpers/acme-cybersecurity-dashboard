import { createApp } from 'vue'
import { library } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

import App from './App.vue'
import router from './router'
import './main.css'

// Imports FontAwesome icons
import { faEnvelope, faLock, faCog, faSignOut, faTrashCan } from '@fortawesome/free-solid-svg-icons'

// Makes FontAwesome icons usable
library.add(faEnvelope, faLock, faCog, faSignOut, faTrashCan)

const app = createApp(App)

// Creates a custom font-awesome-icon tag to import them into the html
app.component('font-awesome-icon', FontAwesomeIcon)

app.use(router)

app.mount('#app')
