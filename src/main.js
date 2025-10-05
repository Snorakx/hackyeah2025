import { createApp } from "vue";
import { createRouter, createWebHistory } from "vue-router";
import App from "./App.vue";
import Dashboard from "./components/Dashboard.vue";
import Simulation from "./components/Simulation.vue";
import Results from "./components/Results.vue";
import AdvancedDashboard from "./components/AdvancedDashboard.vue";
import AdminPanel from "./components/AdminPanel.vue";
import Pitch from "./components/Pitch.vue";

const routes = [
  { path: "/", component: Dashboard },
  { path: "/simulation", component: Simulation },
  { path: "/results", component: Results },
  { path: "/advanced", component: AdvancedDashboard },
  { path: "/admin", component: AdminPanel },
  { path: "/pitch", component: Pitch },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

const app = createApp(App);
app.use(router);
app.mount("#app");
