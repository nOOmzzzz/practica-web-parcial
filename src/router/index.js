import HomeComponent from "../public/pages/home.component.vue";
import {createRouter, createWebHistory} from "vue-router";

const AboutComponent = () => import('../public/pages/about.component.vue');
const PageNotFoundComponent = () => import('../public/pages/page-not-found.component.vue');
const BoundedManagementComponent = () => import('../bounded/pages/bounded-management.component.vue');
const routes = [
    { path: '/home',                    name: 'home',       component: HomeComponent,               meta: { title: 'Home' } },
    { path: '/about',                   name: 'about',      component: AboutComponent,              meta: { title: 'About us' } },
    { path: '/Bounded',                 name: 'Bounded',    component: BoundedManagementComponent,  meta: { title: 'Bounded' } },
    { path: '/',                        name: 'default',    redirect: '/home'  },
    { path: '/:pathMatch(.*)*',         name: 'not-found',  component: PageNotFoundComponent,       meta: { title: 'Page not found' } },
];

const router = createRouter({
    history: createWebHistory(import.meta.BASE_URL),
    routes: routes,
})

router.beforeEach((to, from, next) => {
    console.log(`Navigating from ${from.name} to ${to.name}`);
    let baseTitle = 'Practice for PC1';
    document.title = `${baseTitle} | ${to.meta['title']}`;
    next();
});

export default router;
