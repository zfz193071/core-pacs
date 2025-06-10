/*
 * @Author:
 * @Date: 2023-11-07 10:07:42
 * @LastEditTime: 2023-12-28 14:08:01
 * @LastEditors: ssy
 * @Description:
 */
// import Vue from 'vue' //改为cdn引用了
import Component from "./fnc-notification";

const NotificationConstructor = Vue.extend(Component);

const instances = [];
let seed = 1;

const removeInstance = (instance) => {
  if (!instance) return false;
  const len = instances.length;
  const index = instances.findIndex((inst) => instance.id === inst.id);

  instances.splice(index, 1);

  if (len <= 1) return false;
  const removeHeight = instance.vm.height;
  // eslint-disable-next-line no-plusplus
  for (let i = index; i < len - 1; i++) {
    // eslint-disable-next-line radix
    instances[i].verticalOffset =
      parseInt(instances[i].verticalOffset) - removeHeight - 16;
  }

  return true;
};

const notify = (options) => {
  if (Vue.prototype.$isServer) return false;

  const { autoClose, type, ...rest } = options;

  const instance = new NotificationConstructor({
    propsData: {
      ...rest,
    },
    data: {
      autoClose: autoClose === undefined ? 3000 : autoClose,
    },
  });

  const id = `notification_${seed}`;
  // eslint-disable-next-line no-plusplus
  seed = seed++;
  instance.id = id;
  instance.vm = instance.$mount();
  document.body.appendChild(instance.vm.$el);
  instance.vm.visible = true;

  let verticalOffset = 0;
  instances.forEach((item) => {
    verticalOffset += item.$el.offsetHeight + 16;
  });
  verticalOffset += 16;
  instance.verticalOffset = verticalOffset;
  let color = { bg: "#eafeea", text: "#67c23a" };
  if (type == "warning") {
    color = { bg: "#FEF1CC", text: "#E6A23C" };
    instance.src = require("./icon/warning.png");
  } else if (type == "error") {
    color = { bg: "#FEEAED", text: "#F56C6C" };
    instance.src = require("./icon/error.png");
  } else if (type == "info") {
    color = { bg: "#ECEDED", text: "#909399" };
    instance.src = require("./icon/info.png");
  }
  instance.color = color;
  instances.push(instance);
  instance.vm.$on("closed", () => {
    removeInstance(instance);
    document.body.removeChild(instance.vm.$el);
    instance.vm.$destroy();
  });
  instance.vm.$on("close", () => {
    instance.vm.visible = false;
  });
  return instance.vm;
};

notify.error = (content) => {
  return objNotify(content, "error");
};
notify.warning = (content) => {
  return objNotify(content, "warning");
};
notify.success = (content) => {
  return objNotify(content, "success");
};
notify.info = (content) => {
  return objNotify(content, "info");
};
const objNotify = (content, type) => {
  if (Vue.prototype.$isServer) return false;

  const instance = new NotificationConstructor({
    propsData: {
      content,
    },
    data: {
      autoClose: 3000,
    },
  });

  const id = `notification_${seed}`;
  // eslint-disable-next-line no-plusplus
  seed = seed++;
  instance.id = id;
  instance.vm = instance.$mount();
  document.body.appendChild(instance.vm.$el);
  instance.vm.visible = true;

  let verticalOffset = 0;
  instances.forEach((item) => {
    verticalOffset += item.$el.offsetHeight + 16;
  });
  verticalOffset += 16;
  instance.verticalOffset = verticalOffset;
  let color = { bg: "#eafeea", text: "#67c23a" };
  if (type == "warning") {
    color = { bg: "#FEF1CC", text: "#E6A23C" };
    instance.src = require("./icon/warning.png");
  } else if (type == "error") {
    color = { bg: "#FEEAED", text: "#F56C6C" };
    instance.src = require("./icon/error.png");
  } else if (type == "info") {
    color = { bg: "#ECEDED", text: "#909399" };
    instance.src = require("./icon/info.png");
  }
  instance.color = color;
  instances.push(instance);
  instance.vm.$on("closed", () => {
    removeInstance(instance);
    document.body.removeChild(instance.vm.$el);
    instance.vm.$destroy();
  });
  instance.vm.$on("close", () => {
    instance.vm.visible = false;
  });
  return instance.vm;
};
export default notify;
