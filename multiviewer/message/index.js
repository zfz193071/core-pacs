import Notification from "./notification.vue";
import notify from "./function";

export default (Vue) => {
  Vue.component(Notification.name, Notification);
  // eslint-disable-next-line no-param-reassign
  Vue.prototype.$notify = notify;
};
