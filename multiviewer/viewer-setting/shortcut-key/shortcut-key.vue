<template>
  <div class="shortcut-key">
    <div class="scrollbar2">
      <div class="box-title">{{ $t("settings.titles.shortcutKey") }}</div>
      <div class="tip">{{ $t("settings.shortcutKey.tip") }}</div>
      <div class="key-map">
        <template v-for="(keyInfo, key) in shortcutsKey">
          <div
            v-if="!keyInfo.effect.includes('调窗快捷键')"
            class="item"
            :key="keyInfo.effect"
            :class="{ selected: inputting === keyInfo.effect }"
          >
            <el-checkbox
              :value="keyInfo.enable"
              @change="changeKeyStatus($event, keyInfo)"
            ></el-checkbox>
            <div class="field" @click="editShortcutKey(keyInfo)">
              {{ $t(`settings.shortcutKey.${key}`) }}
            </div>
            <input
              type="text"
              readonly="readonly"
              ref="shortcutsKeyRef"
              v-if="inputting === keyInfo.effect"
              :value="inputKey.keyName"
              @keydown.prevent="editingShortcutKey($event, keyInfo)"
              @blur="saveShortcutKey(keyInfo)"
            />
            <div class="key" v-else @click="editShortcutKey(keyInfo)">
              {{ keyInfo.keyName }}
            </div>
            <div
              class="conflict"
              title="此键与其他热键相冲突"
              :class="{ active: conflict === keyInfo.effect }"
            >
              ⚠️
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "shortcut-key",
  props: {
    shortcutsKey: Object,
  },
  data() {
    return {
      inputting: "", // 正在编辑的快捷键'
      conflict: "", // 冲突的快捷键名
      inputKey: {
        // 当前编辑快捷键的输入
        keyName: "",
        key: 0,
      },
    };
  },

  computed: {
    /**
     * 所有快捷键数组
     * @return {*[]}
     */
    keyCodes() {
      const codes = [];
      for (const field in this.shortcutsKey) {
        const keyInfo = this.shortcutsKey[field];
        codes.push(keyInfo.key);
      }
      return codes;
    },
  },

  methods: {
    /**
     * 开始编辑快捷键
     * @param keyInfo
     */
    editShortcutKey(keyInfo) {
      // 快捷键有冲突，需要用户解决
      if (this.conflict) return;
      const { effect, keyName, key } = keyInfo;

      this.inputting = effect;
      this.inputKey.keyName = keyName;
      this.inputKey.key = key;

      this.$nextTick(() => {
        const inputRef = this.$refs["shortcutsKeyRef"][0];
        inputRef.focus();
      });
    },

    /**
     * 输入快捷键
     * @param $evt
     * @param keyInfo 当前快捷键信息
     */
    editingShortcutKey($evt, keyInfo) {
      const { key, keyCode } = $evt;
      const { effect, key: currKey } = keyInfo;

      this.inputKey.keyName = key;
      this.inputKey.key = keyCode;

      if (keyCode !== currKey && this.keyCodes.includes(keyCode)) {
        this.conflict = effect;
        return;
      }
      this.conflict = "";
    },

    /**
     * 保存编辑快捷键
     * @param keyInfo
     */
    saveShortcutKey(keyInfo) {
      // 快捷键有冲突，需要用户解决
      if (this.conflict) return;

      const { keyName, key } = this.inputKey;
      keyInfo.keyName = keyName;
      keyInfo.key = key;

      localStorage.setItem(
        "customShortcutsKey",
        JSON.stringify(this.shortcutsKey),
      );
      this.inputting = "";
      this.inputKey = {
        keyName: "",
        key: 0,
      };
    },

    /**
     * 更改当前快捷键状态
     * @param value
     * @param keyInfo
     */
    changeKeyStatus(value, keyInfo) {
      keyInfo.enable = value;
      localStorage.setItem(
        "customShortcutsKey",
        JSON.stringify(this.shortcutsKey),
      );
    },
  },

  created() {},
};
</script>

<style lang="sass" scoped>
@import "shortcut-key"
</style>
