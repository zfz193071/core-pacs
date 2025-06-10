<template>
  <div class="tbWrapper" :class="{ vertical: vertical }">
    <div :class="`iconContent icon-${ratio} icon-menu-${theme}`">
      <canvas id="kscreenshot" ref="kscreenshot"></canvas>
      <div class="group">
        <div
          class="item"
          :class="{
            selected: tActiveOpt === 'Page',
            withText: showToolbarText,
            disabled: toolDisable,
          }"
          :title="`${$t('hotKey.page')}${shortcutsKey.Page.keyName}`"
        >
          <div
            :style="{ pointerEvents: toolDisable ? 'none' : '' }"
            @click.stop.prevent="tActiveOpt = 'Page'"
            class="icon-wrapper"
          >
            <svg-icon :name="iconName('page')"></svg-icon>
            <div v-if="showToolbarText" class="toolbar-text">
              {{ $t("page") }}
            </div>
          </div>
        </div>
        <div
          class="list"
          :class="{
            selected: tActiveOpt === 'Window',
            withText: showToolbarText,
          }"
          @click.stop.prevent="tActiveOpt = 'Window'"
          :title="`${$t('hotKey.window')}${shortcutsKey.Window.keyName}`"
        >
          <svg-icon :name="iconName('window')"></svg-icon>
          <div v-if="showToolbarText" class="toolbar-text">
            {{ $t("window") }}
          </div>
          <ul>
            <li
              v-for="item in wwwlSetList"
              :key="item.id"
              :title="item.title"
              @click.stop.prevent="setWWWL(item.id)"
            >
              <svg-icon :name="item.icon"></svg-icon>
              <div class="text">{{ $t(item.key) }}</div>
            </li>
          </ul>
        </div>
        <div
          class="list"
          :class="{
            selected: tActiveOpt === 'Zoom',
            withText: showToolbarText,
          }"
          @click.stop.prevent="tActiveOpt = 'Zoom'"
          :title="$t('zoom')"
        >
          <svg-icon :name="iconName('zoom')"></svg-icon>
          <div v-if="showToolbarText" class="toolbar-text">
            {{ $t("zoom") }}
          </div>
          <ul>
            <li
              :title="$t('fitWindow')"
              @click.stop.prevent="tClickOpt = 'Fit'"
            >
              <svg-icon name="fitImage"></svg-icon>
              <div class="text">{{ $t("fitWindow") }}</div>
            </li>
            <li
              :title="$t('originSize')"
              @click.stop.prevent="tClickOpt = 'OneToOne'"
            >
              <svg-icon name="oneToOne"></svg-icon>
              <div class="text">{{ $t("originSize") }}</div>
            </li>
          </ul>
        </div>
        <div
          class="item"
          id="Magnify"
          :class="{
            selected: tActiveOpt === 'Magnify',
            disabled: toolDisable,
            withText: showToolbarText,
          }"
          :title="$t('magnify')"
        >
          <div
            :style="{ pointerEvents: toolDisable ? 'none' : '' }"
            @click.stop.prevent="tActiveOpt = 'Magnify'"
            class="icon-wrapper"
          >
            <svg-icon :name="iconName('magnify')"></svg-icon>
            <div v-if="showToolbarText" class="toolbar-text">
              {{ $t("magnify") }}
            </div>
          </div>
        </div>
        <div
          class="item"
          :class="{
            selected: tActiveOpt === 'Pan',
            withText: showToolbarText,
          }"
          :title="$t('pan')"
          @click.stop.prevent="tActiveOpt = 'Pan'"
        >
          <svg-icon :name="iconName('pan')"></svg-icon>
          <div v-if="showToolbarText" class="toolbar-text">
            {{ $t("pan") }}
          </div>
        </div>
        <div
          class="list"
          :class="{
            selected: tActiveOpt === 'Rotate',
            withText: showToolbarText,
            disabled: isMPR,
          }"
          @click.stop.prevent="tActiveOpt = 'Rotate'"
          :title="$t('rotate')"
        >
          <svg-icon :name="iconName('rotate')"></svg-icon>
          <div v-if="showToolbarText" class="toolbar-text">
            {{ $t("rotate") }}
          </div>
          <ul>
            <li
              :title="$t('leftRotate')"
              @click.stop.prevent="tClickOpt = 'LeftRotate'"
            >
              <svg-icon name="leftRotate"></svg-icon>
              <div class="text">{{ $t("leftRotate") }}</div>
            </li>
            <li
              :title="$t('rightRotate')"
              @click.stop.prevent="tClickOpt = 'RightRotate'"
            >
              <svg-icon name="rightRotate"></svg-icon>
              <div class="text">{{ $t("rightRotate") }}</div>
            </li>
            <li :title="$t('flip')" @click.stop.prevent="tClickOpt = 'Flip'">
              <svg-icon name="flip"></svg-icon>
              <div class="text">{{ $t("flip") }}</div>
            </li>
            <li
              :title="$t('reverse')"
              @click.stop.prevent="tClickOpt = 'Reverse'"
            >
              <svg-icon name="reverse"></svg-icon>
              <div class="text">{{ $t("reverse") }}</div>
            </li>
          </ul>
        </div>
        <div
          class="item"
          :class="{
            withText: showToolbarText,
          }"
          @click.stop.prevent="tClickOpt = 'Reset'"
          :title="$t('reset')"
        >
          <svg-icon :name="iconName('reset')"></svg-icon>
          <div v-if="showToolbarText" class="toolbar-text">
            {{ $t("reset") }}
          </div>
        </div>
        <div
          v-show="allow2Legac === false"
          class="item"
          :title="$t('meta')"
          :class="{
            withText: showToolbarText,
          }"
          @click.stop.prevent="tClickOpt = 'MetaInfo'"
        >
          <svg-icon :name="iconName('metaInfo')"></svg-icon>
          <div v-if="showToolbarText" class="toolbar-text">
            {{ $t("meta") }}
          </div>
        </div>
      </div>
      <div class="border"></div>
      <div class="group">
        <div
          class="item"
          :class="{
            selected: posLineShow ? true : false,
            withText: showToolbarText,
            disabled: toolDisable,
          }"
          :title="$t('posLine')"
        >
          <div
            :style="{ pointerEvents: toolDisable ? 'none' : '' }"
            @click.stop.prevent="tClickOpt = 'hidePosLine'"
            class="icon-wrapper"
          >
            <svg-icon :name="iconName('posLine')"></svg-icon>
            <div v-if="showToolbarText" class="toolbar-text">
              {{ $t("posLine") }}
            </div>
          </div>
        </div>
        <div
          class="item"
          :class="{
            selected: tActiveOpt === 'ACross',
            withText: showToolbarText,
            longText: showToolbarText,
            disabled: toolDisable,
          }"
          :title="`${$t('hotKey.across')}${shortcutsKey.ACross.keyName}`"
        >
          <div
            :style="{ pointerEvents: toolDisable ? 'none' : '' }"
            @click.stop.prevent="tActiveOpt = 'ACross'"
            class="icon-wrapper"
          >
            <svg-icon :name="iconName('across')"></svg-icon>
            <div v-if="showToolbarText" class="toolbar-text">
              {{ $t("across") }}
            </div>
          </div>
        </div>
        <div
          class="list"
          :class="{ disabled: fixedLayout, withText: showToolbarText }"
        >
          <svg-icon name="layout"></svg-icon>
          <div v-if="showToolbarText" class="toolbar-text">
            {{ $t("layout") }}
          </div>
          <ul v-if="!fixedLayout">
            <li
              @click.stop.prevent="tClickOpt = 'Layout1'"
              :title="$t('singleLayout')"
            >
              <svg-icon name="layout-1"></svg-icon>
              <div class="text">{{ $t("singleLayout") }}</div>
            </li>
            <li
              @click.stop.prevent="tClickOpt = 'Layout2'"
              :title="$t('twoLayout')"
            >
              <svg-icon name="layout-2"></svg-icon>
              <div class="text">{{ $t("twoLayout") }}</div>
            </li>
            <li
              @click.stop.prevent="tClickOpt = 'Layout2.0'"
              :title="$t('twoLayout')"
            >
              <svg-icon name="layout-2_1"></svg-icon>
              <div class="text">{{ $t("twoLayout") }}</div>
            </li>
            <li
              :title="$t('fourLayout')"
              @click.stop.prevent="tClickOpt = 'Layout4'"
            >
              <svg-icon name="layout-4"></svg-icon>
              <div class="text">{{ $t("fourLayout") }}</div>
            </li>
            <li
              :title="$t('sixLayout')"
              @click.stop.prevent="tClickOpt = 'Layout6'"
            >
              <svg-icon name="layout-6"></svg-icon>
              <div class="text">{{ $t("sixLayout") }}</div>
            </li>
            <li
              :title="$t('sixLayout')"
              @click.stop.prevent="tClickOpt = 'Layout6.0'"
            >
              <svg-icon name="layout-6-2"></svg-icon>
              <div class="text">{{ $t("sixLayout") }}</div>
            </li>
            <li
              :title="$t('nineLayout')"
              @click.stop.prevent="tClickOpt = 'Layout9'"
            >
              <svg-icon name="layout-9"></svg-icon>
              <div class="text">{{ $t("nineLayout") }}</div>
            </li>
          </ul>
        </div>
        <div
          class="list"
          :class="{ disabled: fixedGrid, withText: showToolbarText }"
        >
          <svg-icon name="grid"></svg-icon>
          <div v-if="showToolbarText" class="toolbar-text">
            {{ $t("grid") }}
          </div>
          <ul v-if="!fixedGrid">
            <li
              @click.stop.prevent="tClickOpt = 'Grid1'"
              :title="$t('oneGrid')"
            >
              <svg-icon name="layout-1"></svg-icon>
              <div class="text">{{ $t("oneGrid") }}</div>
            </li>
            <li
              @click.stop.prevent="tClickOpt = 'Grid2'"
              :title="$t('twoGrid')"
            >
              <svg-icon name="layout-2"></svg-icon>
              <div class="text">{{ $t("twoGrid") }}</div>
            </li>
            <li
              @click.stop.prevent="tClickOpt = 'Grid2.0'"
              :title="$t('twoGrid')"
            >
              <svg-icon name="layout-2_1"></svg-icon>
              <div class="text">{{ $t("twoGrid") }}</div>
            </li>
            <li
              :title="$t('threeGrid')"
              @click.stop.prevent="tClickOpt = 'Grid3'"
            >
              <svg-icon name="layout-3"></svg-icon>
              <div class="text">{{ $t("threeGrid") }}</div>
            </li>
            <li
              :title="$t('threeGrid')"
              @click.stop.prevent="tClickOpt = 'Grid3.0'"
            >
              <svg-icon name="layout-3-2"></svg-icon>
              <div class="text">{{ $t("threeGrid") }}</div>
            </li>
            <li
              :title="$t('threeGrid')"
              @click.stop.prevent="tClickOpt = 'Grid3.1'"
            >
              <svg-icon name="layout-3-3"></svg-icon>
              <div class="text">{{ $t("threeGrid") }}</div>
            </li>
            <li
              :title="$t('fourGrid')"
              @click.stop.prevent="tClickOpt = 'Grid4'"
            >
              <svg-icon name="layout-4"></svg-icon>
              <div class="text">{{ $t("fourGrid") }}</div>
            </li>

            <li
              :title="$t('fiveGrid')"
              @click.stop.prevent="tClickOpt = 'Grid5'"
            >
              <svg-icon name="layout-5"></svg-icon>
              <div class="text">{{ $t("fiveGrid") }}</div>
            </li>
            <li
              :title="$t('sixGrid')"
              @click.stop.prevent="tClickOpt = 'Grid6'"
            >
              <svg-icon name="layout-6"></svg-icon>
              <div class="text">{{ $t("sixGrid") }}</div>
            </li>
            <li
              :title="$t('sixGrid')"
              @click.stop.prevent="tClickOpt = 'Grid6.0'"
            >
              <svg-icon name="layout-6-2"></svg-icon>
              <div class="text">{{ $t("sixGrid") }}</div>
            </li>
            <li
              :title="$t('nineGrid')"
              @click.stop.prevent="tClickOpt = 'Grid9'"
            >
              <svg-icon name="layout-9"></svg-icon>
              <div class="text">{{ $t("nineGrid") }}</div>
            </li>
            <li
              :title="$t('twelveGrid')"
              @click.stop.prevent="tClickOpt = 'Grid12'"
            >
              <svg-icon name="layout-12"></svg-icon>
              <div class="text">{{ $t("twelveGrid") }}</div>
            </li>
            <li
              :title="$t('3*6Grid')"
              @click.stop.prevent="tClickOpt = 'Grid18'"
            >
              <svg-icon name="layout-3_6"></svg-icon>
              <div class="text">{{ $t("3*6Grid") }}</div>
            </li>
            <li
              :title="$t('5*4Grid')"
              @click.stop.prevent="tClickOpt = 'Grid20'"
            >
              <svg-icon name="layout-5_4"></svg-icon>
              <div class="text">{{ $t("5*4Grid") }}</div>
            </li>
            <li
              :title="$t('6*4Grid')"
              @click.stop.prevent="tClickOpt = 'Grid24'"
            >
              <svg-icon name="layout-6_4"></svg-icon>
              <div class="text">{{ $t("6*4Grid") }}</div>
            </li>
            <li
              :title="$t('6*5Grid')"
              @click.stop.prevent="tClickOpt = 'Grid30'"
            >
              <svg-icon name="layout-6_5"></svg-icon>
              <div class="text">{{ $t("6*5Grid") }}</div>
            </li>
          </ul>
        </div>
        <div
          class="item"
          :class="{
            list: true,
            disabled: toolDisable,
            withText: showToolbarText,
          }"
          v-show="!ifPlaying"
          :title="$t('play')"
        >
          <div
            class="icon-wrapper"
            :style="{ pointerEvents: toolDisable ? 'none' : '' }"
            @click.stop="ifPlaying = true"
          >
            <svg-icon :name="iconName('play')"></svg-icon>
          </div>
          <div v-if="showToolbarText" class="toolbar-text">
            {{ $t("play") }}
          </div>
          <ul>
            <li
              :class="{ selected: speed === 5 }"
              @click.stop.prevent="speed = 5"
            >
              <div class="text play-item">{{ $t("defaultWWWL") }}</div>
            </li>
            <li
              :class="{ selected: speed === 60 }"
              @click.stop.prevent="speed = 60"
            >
              <div class="text play-item">60 FPS</div>
            </li>
            <li
              :class="{ selected: speed === 30 }"
              @click.stop.prevent="speed = 30"
            >
              <div class="text play-item">30 FPS</div>
            </li>
            <li
              :class="{ selected: speed === 15 }"
              @click.stop.prevent="speed = 15"
            >
              <div class="text play-item">15 FPS</div>
            </li>
            <li
              :class="{ selected: speed === 1 }"
              @click.stop.prevent="speed = 1"
            >
              <div class="text play-item">1 FPS</div>
            </li>
          </ul>
        </div>
        <div
          class="item selected"
          :class="{ withText: showToolbarText }"
          @click.stop="ifPlaying = false"
          v-show="ifPlaying"
          :title="$t('pause')"
        >
          <svg-icon :name="iconName('pause')"></svg-icon>
          <div v-if="showToolbarText" class="toolbar-text">
            {{ $t("pause") }}
          </div>
        </div>
        <!-- <div
            class="item template"
            :class="{ selected: tClickOpt === 'tempShow' }"
            :title="`模板，快捷键：${shortcutsKey.tempShow.keyName}`"
            @click.stop.prevent="tClickOpt = 'tempShow'"
          ></div> -->
        <div
          :class="{
            item: true,
            selected: isAutoLinkout,
            disabled: toolDisable,
            withText: showToolbarText,
            longText: showToolbarText,
          }"
          :title="$t('linkoutAuto')"
        >
          <div
            class="icon-wrapper"
            :style="{ pointerEvents: toolDisable ? 'none' : '' }"
            @click.stop.prevent="tClickOpt = 'linkLayoutAuto'"
          >
            <svg-icon :name="iconName('linkoutAuto')"></svg-icon>
          </div>
          <div v-if="showToolbarText" class="toolbar-text">
            {{ $t("linkoutAuto") }}
          </div>
        </div>
        <div
          :class="{
            item: true,
            selected: isManualLinkout,
            disabled: toolDisable,
            withText: showToolbarText,
            longText: showToolbarText,
          }"
          :title="$t('linkoutManual')"
        >
          <div
            class="icon-wrapper"
            :style="{ pointerEvents: toolDisable ? 'none' : '' }"
            @click.stop.prevent="tClickOpt = 'linkLayoutManual'"
          >
            <svg-icon :name="iconName('linkoutManual')"></svg-icon>
          </div>
          <div v-if="showToolbarText" class="toolbar-text">
            {{ $t("linkoutManual") }}
          </div>
        </div>
      </div>
      <div class="border"></div>
      <div class="group">
        <div
          :class="{
            selected: !markClass.includes('measureWindow'),
            list: true,
            disabled: toolDisable,
            withText: showToolbarText,
          }"
          :title="$t('measureWindow')"
        >
          <svg-icon :name="markClass" class="tool-icon"></svg-icon>
          <div v-if="showToolbarText" class="toolbar-text">
            {{ $t("measureWindow") }}
          </div>
          <ul>
            <li
              :class="{ selected: activeOpt === 'Circle' }"
              :title="`${$t('hotKey.circle')}${shortcutsKey.Circle.keyName}`"
              @click.stop.prevent="Icircle"
            >
              <svg-icon name="circle"></svg-icon>
              <div class="text">{{ $t("circle") }}</div>
            </li>
            <li
              :class="{ selected: activeOpt === 'Rect' }"
              :title="`${$t('hotKey.rect')}${shortcutsKey.Rect.keyName}`"
              @click.stop.prevent="Irect"
            >
              <svg-icon name="rect"></svg-icon>
              <div class="text">{{ $t("rect") }}</div>
            </li>
            <li
              :class="{ selected: activeOpt === 'Pen' }"
              :title="`${$t('hotKey.pen')}${shortcutsKey.Pen.keyName}`"
              @click.stop.prevent="Ipen"
            >
              <svg-icon name="pen"></svg-icon>
              <div class="text">{{ $t("pen") }}</div>
            </li>
            <li
              :class="{ selected: activeOpt === 'Angle' }"
              :title="$t('angle')"
              @click.stop.prevent="Langel"
            >
              <svg-icon name="angle"></svg-icon>
              <div class="text">{{ $t("angle") }}</div>
            </li>
            <li
              :class="{ selected: activeOpt === 'Ruler' }"
              :title="`${$t('hotKey.ruler')}${shortcutsKey.Ruler.keyName}`"
              @click.stop.prevent="LRuler"
            >
              <svg-icon name="ruler"></svg-icon>
              <div class="text">{{ $t("ruler") }}</div>
            </li>
            <li
              :class="{ selected: activeOpt === 'CurveRuler' }"
              :title="`${$t('curveRuler')}`"
              @click.stop.prevent="LCurveRuler"
            >
              <svg-icon name="curveRuler"></svg-icon>
              <div class="text">{{ $t("curveRuler") }}</div>
            </li>
            <li
              :class="{ selected: activeOpt === 'Point' }"
              :title="$t('pixel')"
              @click.stop.prevent="LPoint"
            >
              <svg-icon name="point"></svg-icon>
              <div class="text">{{ $t("pixel") }}</div>
            </li>
            <li
              :class="{ selected: activeOpt === 'HeartChest' }"
              :title="$t('cardiothoracicRatio')"
              @click.stop.prevent="LHeartChest"
            >
              <svg-icon name="heartChest"></svg-icon>
              <div class="text">{{ $t("cardiothoracicRatio") }}</div>
            </li>
            <li
              :class="{ selected: activeOpt === 'COBAngle' }"
              :title="$t('COBAngle')"
              @click.stop.prevent="LCOBAngle"
            >
              <svg-icon name="COB"></svg-icon>
              <div class="text">{{ $t("COBAngle") }}</div>
            </li>
          </ul>
        </div>
        <div
          :class="{
            selected: !textMarkClass.includes('markWindow'),
            list: true,
            disabled: toolDisable,
            withText: showToolbarText,
          }"
          :title="$t('markWindow')"
        >
          <svg-icon :name="textMarkClass" class="tool-icon"></svg-icon>
          <div v-if="showToolbarText" class="toolbar-text">
            {{ $t("markWindow") }}
          </div>
          <ul>
            <li
              :class="{ selected: activeOpt === 'CurveLine' }"
              :title="$t('curve')"
              @click.stop.prevent="LcurveLine"
            >
              <svg-icon name="curve"></svg-icon>
              <div class="text">{{ $t("curve") }}</div>
            </li>
            <li
              :class="{ selected: activeOpt === 'Arrow' }"
              :title="$t('arrow')"
              @click.stop.prevent="LArrow"
            >
              <svg-icon name="arrow"></svg-icon>
              <div class="text">{{ $t("arrow") }}</div>
            </li>
            <li
              :class="{ selected: activeOpt === 'Text' }"
              :title="$t('text')"
              @click.stop.prevent="Ltext"
            >
              <svg-icon name="text"></svg-icon>
              <div class="text">{{ $t("text") }}</div>
            </li>
          </ul>
        </div>
        <div
          class="list"
          :class="{
            selected: ['Rubber'].includes(activeOpt),
            disabled: toolDisable,
            withText: showToolbarText,
          }"
          :title="`${$t('hotKey.remove')}${shortcutsKey.delMark.keyName}`"
          @click.stop.prevent="tClickOpt = 'delMark'"
        >
          <svg-icon :name="iconName('clearRoiList')"></svg-icon>
          <div v-if="showToolbarText" class="toolbar-text">
            {{ $t("remove") }}
          </div>
          <ul>
            <li
              :class="{ selected: activeOpt === 'Rubber' }"
              :title="$t('rubber')"
              @click.stop.prevent="LRubber"
            >
              <svg-icon name="rubber"></svg-icon>
              <div class="text">{{ $t("rubber") }}</div>
            </li>
          </ul>
        </div>
        <div
          class="list"
          :class="{ withText: showToolbarText }"
          :title="$t('color')"
        >
          <svg-icon :name="iconName('color')"></svg-icon>
          <div v-if="showToolbarText" class="toolbar-text">
            {{ $t("color") }}
          </div>
          <ul>
            <li
              class="color"
              v-for="item in colors"
              :key="item.title"
              @click.stop.prevent="setColor(item.color)"
            >
              <div class="color-bg" :style="{ background: item.color }"></div>
              <div class="text">{{ $t(item.key) }}</div>
            </li>

            <li class="font-Size">
              <span>{{ $t("fontSize") }}:</span>
              <span
                :class="[
                  'sizeItem',
                  this.rayplus_fontSize == 'small' ? 'selected' : '',
                ]"
                @click.stop.prevent="setFontSize('small')"
                >{{ $t("fontS") }}</span
              >
              <span
                :class="[
                  'sizeItem',
                  this.rayplus_fontSize == 'middle' ? 'selected' : '',
                ]"
                @click.stop.prevent="setFontSize('middle')"
                >{{ $t("fontM") }}</span
              >
              <span
                :class="[
                  'sizeItem',
                  this.rayplus_fontSize == 'large' ? 'selected' : '',
                ]"
                @click.stop.prevent="setFontSize('large')"
                >{{ $t("fontL") }}</span
              >
            </li>
          </ul>
        </div>
        <div
          v-if="isInCPR"
          :class="{
            item: true,
            selected: activeOpt === 'CPRPoint',
            withText: showToolbarText,
            longText: showToolbarText,
          }"
          :title="$t('CPRPoint')"
          @click.stop.prevent="ICPRSelector"
        >
          <svg-icon :name="iconName('pointSelector')"></svg-icon>
          <div v-if="showToolbarText" class="toolbar-text">
            {{ $t("CPRPoint") }}
          </div>
        </div>
        <div
          class="item"
          :class="[
            roiShow > -1 ? 'roiHidden' : 'roiShow',
            showToolbarText ? 'withText' : '',
            showToolbarText ? 'longText' : '',
          ]"
          :title="roiShow > -1 ? $t('markHide') : $t('markShow')"
          @click.stop.prevent="tClickOpt = 'hideMark'"
        >
          <svg-icon :name="iconName('markHide')" v-if="roiShow > -1"></svg-icon>
          <svg-icon :name="iconName('markShow')" v-else></svg-icon>
          <div v-if="showToolbarText" class="toolbar-text">
            <span v-if="roiShow > -1">{{ $t("markHide") }}</span>
            <span v-else>{{ $t("markShow") }}</span>
          </div>
        </div>
        <div
          class="item roiList"
          :class="{ withText: showToolbarText, longText: showToolbarText }"
          :title="$t('markList')"
          @click.stop.prevent="tClickOpt = 'roiList'"
        >
          <svg-icon :name="iconName('markList')"></svg-icon>
          <div v-if="showToolbarText" class="toolbar-text">
            {{ $t("markList") }}
          </div>
        </div>
        <div
          v-if="imageData.isVR"
          :class="{
            list: true,
            selected: activeOpt === 'Crop' || activeOpt === 'PenCrop',
            withText: showToolbarText,
          }"
          :title="$t('crop')"
          @click.stop.prevent="tActiveOpt = 'Rotate'"
        >
          <svg-icon :name="iconName('crop')"></svg-icon>
          <div v-if="showToolbarText" class="toolbar-text">
            {{ $t("crop") }}
          </div>
          <ul>
            <li
              :class="{
                selected: activeOpt === 'Crop',
                disabled: activeOpt === 'PenCrop',
              }"
              :title="$t('boxCrop')"
              @click.stop.prevent="IVRCrop"
            >
              <svg-icon name="boxCrop"></svg-icon>
              <div class="text">{{ $t("boxCrop") }}</div>
            </li>
            <li
              :class="{
                selected: activeOpt === 'PenCrop',
                disabled: activeOpt === 'Crop',
              }"
              :title="$t('penCrop')"
              @click.stop.prevent="IPenCrop"
            >
              <svg-icon name="penCrop"></svg-icon>
              <div class="text">{{ $t("penCrop") }}</div>
            </li>
            <!-- 一键去床功能只能处理CT数据 -->
            <li
              :class="{ disabled: seriesInfo && seriesInfo.model != 'CT' }"
              :title="$t('tabelRemove')"
              @click.stop.prevent="tClickOpt = 'tabelRemove'"
            >
              <svg-icon name="tabelRemove"></svg-icon>
              <div class="text">{{ $t("tabelRemove") }}</div>
            </li>
            <li :title="$t('reset')" @click.stop.prevent="resetVRCrop">
              <svg-icon name="resetCrop"></svg-icon>
              <div class="text">{{ $t("reset") }}</div>
            </li>
          </ul>
        </div>
        <div
          class="list"
          :class="{
            selected: isScreenshot,
            withText: showToolbarText,
            longText: showToolbarText,
          }"
          @click.stop.prevent="saveImgHandle"
          :title="`${$t('hotKey.saveImg')}${shortcutsKey.imgSave.keyName}`"
        >
          <svg-icon :name="iconName('saveImg')"></svg-icon>
          <div v-if="showToolbarText" class="toolbar-text">
            {{ $t("saveImg") }}
          </div>
          <ul>
            <li
              @click.stop.prevent="tClickOpt = 'imageList'"
              :title="$t('imageDetail')"
            >
              <svg-icon name="imageDetail"></svg-icon>
              <div class="text">{{ $t("imageDetail") }}</div>
            </li>
          </ul>
        </div>
      </div>
      <div class="border"></div>
      <div class="group">
        <div
          class="list"
          :class="{ withText: showToolbarText, disabled: toolDisable }"
          :title="$t('view')"
        >
          <svg-icon :name="iconName('orientation')"></svg-icon>
          <div v-if="showToolbarText" class="toolbar-text">
            {{ $t("view") }}
          </div>
          <ul>
            <li
              :class="{ disabled: viewDisable }"
              @click.stop.prevent="limitedToClickOpt(viewDisable, 'Cross')"
              :title="$t('cross')"
            >
              <svg-icon name="cross"></svg-icon>
              <div class="text">{{ $t("cross") }}</div>
            </li>

            <li
              :class="{ disabled: viewDisable }"
              @click.stop.prevent="limitedToClickOpt(viewDisable, 'Coronal')"
              :title="$t('coronal')"
            >
              <svg-icon name="coronal"></svg-icon>
              <div class="text">{{ $t("coronal") }}</div>
            </li>

            <li
              :class="{ disabled: viewDisable }"
              @click.stop.prevent="limitedToClickOpt(viewDisable, 'Sagittal')"
              :title="$t('sagittal')"
            >
              <svg-icon name="sagittal"></svg-icon>
              <div class="text">{{ $t("sagittal") }}</div>
            </li>
          </ul>
        </div>
        <div
          class="list"
          :class="{
            selected: !(
              imageData.colormapIndex == 'B&W' ||
              imageData.colormapIndex == 'B&W Inverse'
            ),
            withText: showToolbarText,
            disabled: isVR,
          }"
          :title="$t('pseudo')"
        >
          <div
            :style="{ pointerEvents: toolDisable ? 'none' : '' }"
            @click.stop.prevent="tClickOpt = 'ChangeColor'"
            class="icon-wrapper"
          >
            <svg-icon :name="iconName('colormap')"></svg-icon>
            <div v-if="showToolbarText" class="toolbar-text">
              {{ $t("pseudo") }}
            </div>
          </div>
          <ul>
            <li
              @click.stop.prevent="tClickOpt = 'Colormap'"
              :title="$t('pseudoPreset')"
            >
              <svg-icon name="pseudoColor"></svg-icon>
              <div class="text">{{ $t("pseudoPreset") }}</div>
            </li>
          </ul>
        </div>
        <div
          class="item"
          :class="{ withText: showToolbarText, longText: showToolbarText }"
          @click.stop="$emit('update:dicomTempShow', !dicomTempShow)"
          :title="$t('hideInfo')"
        >
          <svg-icon :name="iconName('hiddeninfo')"></svg-icon>
          <div v-if="showToolbarText" class="toolbar-text">
            {{ $t("hideInfo") }}
          </div>
        </div>
        <div
          class="list"
          :class="{
            selected: ThreeSelected,
            withText: showToolbarText,
            longText: showToolbarText,
          }"
          :title="$t('reconstruction')"
          @click.stop="setThreeDView"
        >
          <svg-icon :name="iconName('mip')"></svg-icon>
          <div v-if="showToolbarText" class="toolbar-text">
            {{ $t("reconstruction") }}
          </div>
          <ul>
            <li
              :class="{
                disabled: MPRDisable,
              }"
              title="MPR"
              @click.stop.prevent="handleMPR"
            >
              <svg-icon name="layout-3-3"></svg-icon>
              <div class="text">MPR</div>
            </li>
            <li
              :title="unSupportReconstruction ? unSupportTitle : 'CPR'"
              :class="{ selected: isInCPR, disabled: CPRDisable }"
              @click.stop.prevent="limitedToClickOpt(CPRDisable, 'CPR')"
            >
              <svg-icon name="cpr"></svg-icon>
              <div class="text">CPR</div>
            </li>
            <li
              :title="unSupportReconstruction ? unSupportTitle : 'VR'"
              :class="{ selected: isInVR, disabled: VRDisable }"
              @click.stop.prevent="limitedToClickOpt(VRDisable, 'VR')"
            >
              <svg-icon name="vr"></svg-icon>
              <div class="text">VR</div>
            </li>
          </ul>
        </div>
        <!-- <div
            class="item"
            title="TB值"
            @click.stop="$emit('update:suvShow', !suvShow)"
          >
            <svg-icon :name="iconName('thickness')"></svg-icon>
          </div> -->
        <div
          class="item"
          :class="{
            selected: square,
            withText: showToolbarText,
            longText: showToolbarText,
          }"
          :title="$t('square')"
          @click.stop.prevent="
            Screenshot.cancelScreenShot(), $emit('changeSquare')
          "
        >
          <svg-icon :name="iconName('squareBtn')"></svg-icon>
          <div v-if="showToolbarText" class="toolbar-text">
            {{ $t("square") }}
          </div>
        </div>
        <div
          v-if="showHistory"
          class="list"
          :class="{
            withText: showToolbarText,
          }"
          :title="$t('more')"
        >
          <svg-icon :name="iconName('more')"></svg-icon>
          <div v-if="showToolbarText" class="toolbar-text">
            {{ $t("more") }}
          </div>
          <ul>
            <li
              :class="{ disabled: historyDisable }"
              @click.stop.prevent="limitedToClickOpt(historyDisable, 'History')"
              :title="$t('history')"
            >
              <svg-icon name="history"></svg-icon>
              <div class="text">{{ $t("history") }}</div>
            </li>
            <li
              @click.stop.prevent="tClickOpt = 'Download'"
              :title="$t('download')"
            >
              <svg-icon name="download"></svg-icon>
              <div class="text">{{ $t("download") }}</div>
            </li>
          </ul>
        </div>
        <div
          class="item"
          :class="{ withText: showToolbarText }"
          :title="$t('registration')"
          @click.stop.prevent="tClickOpt = 'registrationShow'"
        >
          <svg-icon :name="iconName('registration')"></svg-icon>
          <div v-if="showToolbarText" class="toolbar-text">
            {{ $t("registration") }}
          </div>
        </div>
        <div
          v-if="showImageStitching"
          class="item"
          :class="{ withText: showToolbarText }"
          :title="$t('settings.imageStitching.title')"
          @click.stop.prevent="openStitching"
        >
          <svg-icon :name="iconName('stitching')"></svg-icon>
          <div v-if="showToolbarText" class="toolbar-text">
            {{ $t("settings.imageStitching.title") }}
          </div>
        </div>
        <div
          v-if="showPrintEntry"
          class="list"
          :class="{ withText: showToolbarText }"
          :title="$t('print')"
          @click.stop.prevent="openPrint"
        >
          <svg-icon :name="iconName('print')"></svg-icon>
          <div v-if="showToolbarText" class="toolbar-text">
            {{ $t("print") }}
          </div>
          <ul>
            <li
              @click.stop.prevent="openPrintSeries"
              :title="$t('printCurrentSeries')"
            >
              <svg-icon name="printCurrent"></svg-icon>
              <div class="text">{{ $t("printCurrentSeries") }}</div>
            </li>
          </ul>
        </div>
        <div
          class="list"
          :class="{
            withText: showToolbarText,
            longText: showToolbarText,
            disabled: fixedGrid,
          }"
          :title="$t('split')"
        >
          <svg-icon :name="iconName('split')"></svg-icon>
          <div v-if="showToolbarText" class="toolbar-text">
            {{ $t("split") }}
          </div>
          <ul>
            <li
              :class="{ disabled: seriesDisable }"
              :title="$t('seriesSplit')"
              @click.stop.prevent="handleSeries('split')"
            >
              <svg-icon name="split-series"></svg-icon>
              <div class="text">{{ $t("seriesSplit") }}</div>
            </li>
            <li
              :title="$t('addSeries')"
              :class="{ disabled: seriesDisable }"
              @click.stop.prevent="handleSeries('add')"
            >
              <svg-icon name="add-series"></svg-icon>
              <div class="text">{{ $t("addSeries") }}</div>
            </li>
          </ul>
        </div>
        <div
          class="item"
          :class="{ withText: showToolbarText }"
          :title="$t('share')"
          @click.stop.prevent="$emit('handleShare')"
        >
          <svg-icon :name="iconName('code')"></svg-icon>
          <div v-if="showToolbarText" class="toolbar-text">
            {{ $t("share") }}
          </div>
        </div>
        <div
          class="item"
          :class="{ withText: showToolbarText }"
          :title="$t('setting')"
          @click.stop.prevent="tClickOpt = 'settingShow'"
        >
          <svg-icon :name="iconName('settingBtn')"></svg-icon>
          <div v-if="showToolbarText" class="toolbar-text">
            {{ $t("setting") }}
          </div>
        </div>
        <div class="poor-percent" v-if="!isCompatibility">
          <el-progress
            v-if="imgPoorPrecent !== 100"
            type="circle"
            :stroke-width="3"
            :width="30"
            text-color="#3B8BE4"
            define-back-color="#CCCCCC"
            :percentage="imgPoorPrecent"
          ></el-progress>
        </div>
      </div>
      <!-- <div
          class="legacy-version"
          v-show="allow2Legac"
          @click.stop="go2Legacy"
        >
          <div class="bg"></div>
          <div class="text">回到旧版</div>
        </div> -->
    </div>
    <!-- <div class="btn-lang" @click="changeLang">
      {{ lang === "zh" ? "English" : "中文" }}
    </div> -->
  </div>
</template>

<script>
import seriesApi from "../../../assets/api/series.js";
import screenshot from "../../../assets/screenshot/screenshot.js";
import { showToolbar } from "../../../assets/screenshot/util";
import draw from "../../../assets/screenshot/draw";
import ACTIVEOPT from "@/components/multiviewer/js/activeOpt";
import CLICKOPT from "../js/clickOpt.js";
import { mapState } from "vuex";
import { getDataType } from "@/assets/js/YMDataHandler.js";
import moment from "moment";
export default {
  name: "viewer-toolbar",
  props: {
    activeOpt: { required: true, default: "Page" },
    clickOpt: { required: true, default: "default" },
    imgPoor: { type: Object, required: true },
    imageData: {
      required: true,
      default() {
        return {};
      },
    },
    viewportID: {
      type: String,
      required: true,
    },
    canvasNow: {
      type: Number,
      required: true,
      default: 0,
    },
    canvasRange: { type: Object, required: true },
    seriesInfo: {
      default() {
        return {};
      },
    },
    roiShow: { required: true },
    posLineShow: { required: true },
    vertical: { required: true },
    isCatchShow: {},
    square: {},
    layoutNum: { required: true },
    gridNum: {},
    ifMPRScaleSync: {},
    hasAIAnalysis: Boolean,
    aiShow: Boolean,
    rayplus_color: {},
    rayplus_fontSize: { type: String, default: "small" },
    dicomTempShow: Boolean,
    suvShow: Boolean,
    WindowLevelSetData: {},
    currViewport: {
      required: true,
      default() {
        return {};
      },
    },
    viewportList: Object,
    shortcutsKey: {
      type: Object,
      required: true,
    },
    imgPoorPrecent: {
      type: Number,
      required: true,
    },
    isInCPR: {
      type: Boolean,
      required: true,
    },
    isInVR: {
      type: Boolean,
      required: true,
    },
    isAutoLinkout: {
      type: Boolean,
      required: true,
    },
    isManualLinkout: {
      type: Boolean,
      required: true,
    },
    isInMPR: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      // 工具箱的变量
      handleBoxH1: true,
      windowBoxH1: true,
      gridBoxH1: true,
      viewBoxH1: true,
      toolBoxH1: true,
      reportBoxH1: true,
      tActiveOpt: "Page",
      tClickOpt: "default",
      pet_opacity: 0.5,

      Screenshot: null, //截屏
      ScreenshotStatus: "load", // load:下载, Screenshot:存云上
      isScreenshot: false,
      screenshotProOn: null,
      screenshotProTime: null,
      colors: [
        { color: "#0c00ff", title: "蓝色", key: "blue" },
        { color: "#08f5b1", title: "绿色", key: "green" },
        { color: "#02eee6", title: "青色", key: "cyan" },
        { color: "#AB2526", title: "红色", key: "red" },
        { color: "#DE6D00", title: "橙色", key: "orange" },
        { color: "#111111", title: "黑色", key: "black" },
        { color: "#FFFFFF", title: "白色", key: "white" },
      ],
      // 自动播放
      ifPlaying: false,

      allow2Legac: false, // 允许回到旧版
      showPointSelector: false, // 选点器
      markClass: "measureWindow",
      textMarkClass: "markWindow",
      webGLSupport: true,
      speed: 5,
      historyDisable: false,
    };
  },

  created() {
    const route = this.$route;
    if (route.params.env === "open" || route.params.env === "view") {
      this.allow2Legac = true;
    }
    // 判断浏览器是否支持webGL
    this.webGLSupport = this.checkGLSupport();

    const { env } = getDataType();
    if (env.toLocaleLowerCase() === "studies") {
      this.historyDisable = true;
    }
  },

  computed: {
    ...mapState([
      "lang",
      "studyInfos",
      "isLowerConfigureDevice",
      "imageStitchingList",
    ]),
    showPrintEntry() {
      const obj = getDataType();
      const show = !["view", "open", "display", "study"].includes(obj.env);
      // 多人对比不能进打印，但是针对DR一次检查，多个部位的情况进行特殊处理
      let special = false;
      let keys = Object.keys(this.studyInfos);
      if (keys.length > 1) {
        const isSame = keys.every(
          (key) =>
            this.studyInfos[key].accessionNumber ===
            this.studyInfos[keys[0]].accessionNumber,
        );
        special = isSame;
      } else special = true;
      return show && special;
    },
    showHistory() {
      const obj = getDataType();
      const show = !["view", "open", "display", "study"].includes(obj.env);
      return show;
    },
    showImageStitching() {
      const enableImageStitching = localStorage.getItem("enableImageStitching");
      return enableImageStitching === "true";
    },
    fixedLayout() {
      return this.isInCPR || this.isInMPR || this.isInVR;
    },
    fixedGrid() {
      return this.isInCPR || this.isInMPR || this.isInVR;
    },
    wwwlSetList() {
      let wwwlSetList = [
        {
          title: this.$t("reverseBW"),
          class: "SWWWL_R",
          icon: "SWWWL_R",
          id: "ReverseBW",
          key: "reverseBW",
        },
      ];
      let len = this.WindowLevelSetData.length;
      if (len > 7) {
        len = 7;
      }
      for (let i = 0; i < len; i++) {
        let obj = {
          title: this.$t(this.WindowLevelSetData[i].key),
          id: this.WindowLevelSetData[i].id,
          class: "SWWWL_S",
          icon: `SWWWL_${this.WindowLevelSetData[i].id}`,
          key: this.WindowLevelSetData[i].key,
        };
        if (this.seriesInfo.model === "CT" || i == 0 || i === 1) {
          //最大范围或者默认值读同一个图标
          obj.class = `SWWWL_${this.WindowLevelSetData[i].id}`;
        }
        wwwlSetList.push(obj);
      }
      return wwwlSetList;
    },
    isFull() {
      let { index } = this.canvasRange;
      let res = index;
      return res !== -1;
    },
    isCPR() {
      return this.imageData && this.imageData.isCPR;
    },
    hasMip() {
      return this.imageData && this.imageData.hasMip;
    },
    isVR() {
      return this.imageData && this.imageData.isVR;
    },
    isMPR() {
      return this.isInMPR;
    },
    toolDisable() {
      return this.isVR || this.isCPR;
    },
    viewDisable() {
      return this.seriesInfo.isNotUniformSquence;
    },
    isCompatibility() {
      const useCompatibility =
        localStorage.getItem("useCompatibility") === "true";
      return this.isLowerConfigureDevice || useCompatibility;
    },
    MPRDisable() {
      return (
        this.isInCPR ||
        this.isInVR ||
        this.seriesInfo.isNotUniformSquence ||
        !this.webGLSupport ||
        this.isLowerConfigureDevice
      );
    },
    CPRDisable() {
      const useCompatibility =
        localStorage.getItem("useCompatibility") === "true";
      return (
        this.isInMPR ||
        this.isInVR ||
        this.seriesInfo.isNotUniformSquence ||
        !this.webGLSupport ||
        this.isLowerConfigureDevice ||
        useCompatibility
      );
    },
    VRDisable() {
      const useCompatibility =
        localStorage.getItem("useCompatibility") === "true";
      return (
        this.isInMPR ||
        this.isInCPR ||
        this.seriesInfo.isNotUniformSquence ||
        !this.webGLSupport ||
        this.isLowerConfigureDevice ||
        useCompatibility
      );
    },
    unSupportTitle() {
      if (!this.webGLSupport) return this.$t("unsupport.webGL");
      const useCompatibility =
        localStorage.getItem("useCompatibility") === "true";
      if (this.isLowerConfigureDevice || useCompatibility)
        return this.$t("unsupport.lowConfigure");
      return "";
    },
    unSupportReconstruction() {
      const useCompatibility =
        localStorage.getItem("useCompatibility") === "true";
      return (
        !this.webGLSupport || this.isLowerConfigureDevice || useCompatibility
      );
    },
    ratio() {
      const scale = this.$store.state.scaleRatio;
      return scale * 100;
    },
    theme() {
      return this.$store.state.theme;
    },
    showToolbarText() {
      return this.$store.state.showToolbarText;
    },
    ThreeSelected() {
      return this.isInCPR || this.isInMPR || this.isInVR;
    },
    seriesDisable() {
      const { initViewMod } = this.seriesInfo;
      const { curViewMod } = this.imageData;
      return initViewMod !== curViewMod;
    },
  },
  mounted() {
    this.tActiveOpt = this.activeOpt;
    this.Screenshot = new screenshot({
      cancelCB: () => {
        this.isScreenshot = false;
        this.$emit("update:isCatchShow", true);
      },
      sureCB: (data, img) => {
        this.ScreenshotStatus = "Screenshot";
        this.saveImg(data, img);
        this.$emit("update:isCatchShow", true);
      },
      sureDw: (data, img) => {
        this.ScreenshotStatus = "load";
        this.saveImg(data, img);
        this.$emit("update:isCatchShow", true);
      },
      reflash: (vrW_id) => {
        this.reflash(vrW_id);
      },
      parent: this,
    });
    if (this.theme === "light") {
      this.markClass = "measureWindow-light";
      this.textMarkClass = "markWindow-light";
    }
  },
  beforeDestroy() {
    this.Screenshot.destroy();
  },
  methods: {
    handleSeries(type) {
      if (this.seriesDisable) return;
      this.$emit("handleSeries", type);
    },
    changeLang() {
      if (this.lang === "zh") {
        this.$store.commit("setLang", "en");
        this.$i18n.locale = "en";
      } else {
        this.$store.commit("setLang", "zh");
        this.$i18n.locale = "zh";
      }
      localStorage.setItem("lang", this.$i18n.locale);
    },
    openPrint() {
      let path, search;
      const studyInfos = this.$store.state.studyInfos;
      const envObj = getDataType();
      if (envObj.env.toLocaleLowerCase() === "studies") {
        if (location.search) {
          search = location.search + `&studyID=multi`;
        } else {
          search = `?studyID=multi`;
        }
      } else {
        const key = Object.keys(studyInfos)[0];
        if (location.search) {
          // 先默认取第一个study的信息
          search = location.search + `&studyID=${key}`;
        } else {
          search = `?studyID=${key}`;
        }
      }
      path = "/print" + location.pathname;
      Vue.prototype.$openScreen(location.origin + path + search, "printPage");
    },
    openPrintSeries() {
      const studyInfos = this.$store.state.studyInfos;
      const key = Object.keys(studyInfos)[0];
      let search;
      if (location.search) {
        // 先默认取第一个study的信息
        search = location.search + `&studyID=${key}`;
      } else {
        search = `?studyID=${key}`;
      }
      search += `&seriesId=${this.currViewport.currentSID}`;
      const path = "/print" + location.pathname;
      Vue.prototype.$openScreen(location.origin + path + search, "printPage");
    },
    checkGLSupport() {
      const canvas = document.createElement("canvas");
      const gl =
        canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
      return gl !== null;
    },
    iconName(name) {
      const theme = this.$store.state.theme;
      if (theme === "light") return `${name}-light`;
      return name;
    },
    limitedToClickOpt(flag, type) {
      if (!flag) {
        this.tClickOpt = type;
      }
    },
    setThreeDView() {
      if (this.isInCPR) this.tClickOpt = "CPR";
      else if (this.isInVR) this.tClickOpt = "VR";
      else if (this.isInMPR) this.tClickOpt = "quitMPR";
    },
    handleMPR() {
      if (this.isInMPR) {
        this.tClickOpt = "quitMPR";
      } else {
        this.limitedToClickOpt(this.MPRDisable, "MPR3");
      }
    },
    changeifMPRScaleSync() {
      this.$emit("update:ifMPRScaleSync", !this.ifMPRScaleSync);
    },
    setWWWL(id) {
      if (id === "ReverseBW") {
        this.tClickOpt = "ReverseBW";
      } else {
        CLICKOPT.setWWWLByOneKey(this, id);
      }
    },
    // 获取下载区域坐标点
    getPointList() {
      let dom = document.getElementById("scrennshot_container");
      let pointList = [];
      let width = dom.clientWidth,
        height = dom.clientHeight;
      pointList[0] = { x: 0, y: 0 };
      pointList[1] = { x: width, y: 0 };
      pointList[2] = { x: width, y: height };
      pointList[3] = { x: 0, y: height };

      return pointList;
    },
    //保存截图
    saveImgHandle() {
      this.$emit("update:isCatchShow", false);
      if (this.isScreenshot) return (this.isScreenshot = false);

      this.ScreenshotStatus = this.$options.data().ScreenshotStatus;
      this.isScreenshot = true;
      this.Screenshot.points = [];
      this.$layer(); //防止截屏太快把上一个弹窗截进去了
      setTimeout(() => {
        this.Screenshot.startScreenShot();
        this.Screenshot.points = this.getPointList();
        this.Screenshot.drawStatus = 3;
        draw(this.Screenshot);
        showToolbar(this.Screenshot);
      }, 0);
    },
    //一键截屏
    oneSave() {
      if (this.isScreenshot) {
        return;
      }
      this.$emit("update:isCatchShow", false);
      this.ScreenshotStatus = this.$options.data().ScreenshotStatus;
      this.isScreenshot = true;
      this.Screenshot.points = this.getPointList();
      this.$layer(); //防止截屏太快把上一个弹窗截进去了
      setTimeout(() => {
        this.Screenshot.startScreenShot();
        this.Screenshot.sureScreenShot((data, img) => {
          this.saveImg(data, img);
          this.$emit("update:isCatchShow", true);
        });
      }, 0);
    },
    //截屏保存
    saveImg(data, img) {
      if (!this.screenshotProOn) {
        this.isScreenshot = false;
        return;
      }
      if (this.ScreenshotStatus === "load") {
        //保存都本地
        let save_link = document.createElementNS(
          "http://www.w3.org/1999/xhtml",
          "a",
        );
        save_link.href = img;
        save_link.download = "save.png";
        let event = document.createEvent("MouseEvents");
        event.initMouseEvent(
          "click",
          true,
          false,
          window,
          0,
          0,
          0,
          0,
          0,
          false,
          false,
          false,
          false,
          0,
          null,
        );
        save_link.dispatchEvent(event);
        this.screenshotProOn = false;
      } else if (this.ScreenshotStatus === "Screenshot") {
        //保存到云上
        let canvas = this.$refs.kscreenshot;
        let ctx = canvas.getContext("2d");
        let image = new Image();
        image.crossOrigin = "anonymous";
        image.onload = async () => {
          let { width, height } = image;
          let scale = this.square ? 1 : 126 / 80;
          if (width / height > scale) {
            canvas.width = width;
            canvas.height = width / scale;
          } else {
            canvas.height = height;
            canvas.width = height * scale;
          }
          let color = "#000";
          ctx.fillStyle = color;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          //平移
          ctx.translate(
            canvas.width / 2 - width / 2,
            canvas.height / 2 - height / 2,
          );
          ctx.drawImage(image, 0, 0);
          let dataURL = canvas.toDataURL("image/jpeg");
          let file = this.dataURL2File(dataURL, new Date().getTime() + ".jpg");
          const formData = new FormData();
          formData.append("file", file);
          const studyInfos = this.$store.state.studyInfos;
          const keys = Object.keys(studyInfos);

          if (keys.length > 1) {
            keys.sort((a, b) => {
              return moment(studyInfos[a].date).isAfter(
                moment(studyInfos[b].date),
              )
                ? -1
                : 1;
            });
          }
          let studyKey = keys[0];
          seriesApi
            .screenshotUpload(studyKey, "", formData)
            .then((res) => {
              if (res.code === 200) {
                this.$layer("保存截图成功");
                this.$emit("updateImageList");
              } else {
                this.$layer("无权限，保存失败", 2000, "warn");
              }
              this.isScreenshot = false;
              this.screenshotProOn = false;
            })
            .catch(() => {
              this.isScreenshot = false;
              this.screenshotProOn = false;
            });
        };
        image.src = data;
      }
    },
    dataURL2File(dataurl, filename) {
      let arr = dataurl.split(","),
        mime = arr[0].match(/:(.*?);/)[1],
        bstr = atob(arr[1]),
        n = bstr.length,
        u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      return new File([u8arr], filename, { type: mime });
    },

    syncHandle() {
      this.tClickOpt = "loadSync";
    },
    //截图前得刷新一下vtk 不然导致vtk图像没法截进去，2023-09-13 为解决西咸无法截图问题，修改刷新机制
    reflash(vrW_id) {
      let renders = this.$parent.$refs.render || [];
      for (let i = 0; i < renders.length; i++) {
        let vr = renders[i].$refs.vr;
        if (vr && vr.id === vrW_id) {
          console.log("reflash vr", vrW_id, new Date().getTime());
          let { renderWindow } = vr;
          renderWindow.render();
        }
      }
    },
    resetVRCrop() {
      const lastOpt = this.activeOpt;
      this.$emit("update:activeOpt", "resetCrop");
      this.$nextTick(() => {
        this.$emit("update:activeOpt", lastOpt);
      });
    },

    // ROI工具
    setColor(item) {
      this.$emit("update:rayplus_color", item);
      localStorage.rayplus_color = item;
    },
    setFontSize(key) {
      this.$emit("update:rayplus_fontSize", key);
      localStorage.rayplus_fontSize = key;
    },
    ICPRSelector() {
      this.$emit("update:activeOpt", "CPRPoint");
    },
    IVRCrop() {
      if (this.activeOpt === "PenCrop") return;
      this.$emit(
        "update:activeOpt",
        this.activeOpt === "Crop" ? "Rotate" : "Crop",
      );
    },
    IPenCrop() {
      if (this.activeOpt === "Crop") return;
      this.$emit(
        "update:activeOpt",
        this.activeOpt === "PenCrop" ? "Rotate" : "PenCrop",
      );
    },
    Ipen() {
      this.$emit("update:activeOpt", "Pen");
      this.markClass = "pen";
    },
    Icircle() {
      this.$emit("update:activeOpt", "Circle");
      this.markClass = "circle";
    },
    Irect() {
      this.$emit("update:activeOpt", "Rect");
      this.markClass = "rect";
    },
    LcurveLine() {
      this.$emit("update:activeOpt", "CurveLine");
      this.textMarkClass = "curve";
    },
    LArrow() {
      this.$emit("update:activeOpt", "Arrow");
      this.textMarkClass = "arrow";
    },
    Langel() {
      this.$emit("update:activeOpt", "Angle");
      this.markClass = "angle";
    },
    LRuler() {
      this.$emit("update:activeOpt", "Ruler");
      this.markClass = "ruler";
    },
    LCurveRuler() {
      this.$emit("update:activeOpt", "CurveRuler");
      this.markClass = "curveRuler";
    },
    Ltext() {
      this.$emit("update:activeOpt", "Text");
      this.textMarkClass = "text";
    },
    LRubber() {
      this.$emit("update:activeOpt", "Rubber");
    },
    VOITool() {
      this.$emit("update:clickOpt", "VOITool");
    },
    LPoint() {
      this.$emit("update:activeOpt", "Point");
      this.markClass = "point";
    },
    LHeartChest() {
      this.$emit("update:activeOpt", "HeartChest");
      this.markClass = "heartChest";
    },
    LCOBAngle() {
      this.$emit("update:activeOpt", "COBAngle");
      this.markClass = "COB";
    },
    roiEditBoxClose() {
      this.$emit("update:roiEditBoxShow", false);
    },
    setParam() {
      this.$emit("update:clickOpt", "setParam");
    },
    autoPlayHandle() {
      if (this.ifPlaying) {
        this.scrollNext();
        let time = Number((1000 / this.speed).toFixed(0));
        setTimeout(() => {
          this.autoPlayHandle();
        }, time);
      }
    },
    scrollNext() {
      //用于播放，始终只翻一页
      let num = 1;
      ACTIVEOPT.scrollHandle(this.currViewport, num);
    },

    blurMixOpacity() {
      if (this.pet_opacity > 1) {
        this.pet_opacity = "1";
      } else if (this.pet_opacity < 0) {
        this.pet_opacity = "0";
      } else if (this.pet_opacity === "") {
        this.pet_opacity = "0.5";
      }
    },
    go2Legacy() {
      let pathname = location.pathname;
      if (pathname.includes("/miiaviewer")) {
        pathname = pathname.replace("/miiaviewer", "");
      }
      const domain = "https://pacs3.rimagdata.com/";
      const href = new URL(pathname, domain).href;
      location.href = href;
    },
    openStitching() {
      if (
        this.imageStitchingList.length < 2 ||
        this.imageStitchingList.length > 6
      ) {
        this.$layer("请选择2至6张图像", undefined, "warn");
        return;
      }
      this.tClickOpt = "imageStitchingShow";
    },
  },
  watch: {
    theme(val) {
      if (val === "light") {
        this.markClass = "measureWindow-light";
        this.textMarkClass = "markWindow-light";
      } else {
        this.markClass = "measureWindow";
        this.textMarkClass = "markWindow";
      }
    },
    screenshotProOn(newVal) {
      let timeStart = new Date().getTime();
      this.screenshotProTime = timeStart;
      if (newVal === true) {
        //截图计算的上限时间是7秒
        //开启截图
        setTimeout(
          () => {
            if (
              this.screenshotProTime === timeStart &&
              this.screenshotProOn === true
            ) {
              this.screenshotProOn = false;
              this.Screenshot.cancelScreenShot();
              this.$layer("保存截图失败:响应超时", 2000, "fail");
            }
          },
          5000,
          timeStart,
        );
      }
    },
    tClickOpt() {
      if (this.tClickOpt === "default") return;
      this.$emit("update:clickOpt", this.tClickOpt);
      this.tClickOpt = "default";
    },
    tActiveOpt() {
      this.$emit("update:activeOpt", this.tActiveOpt);
    },
    activeOpt() {
      this.tActiveOpt = this.activeOpt;
      if (!["CurveLine", "Arrow", "Text"].includes(this.activeOpt)) {
        this.textMarkClass =
          this.theme !== "light" ? "markWindow" : "markWindow-light";
      }

      if (
        ![
          "Circle",
          "Rect",
          "Pen",
          "Angle",
          "Ruler",
          "CurveRuler",
          "Point",
          "HeartChest",
          "COBAngle",
        ].includes(this.activeOpt)
      ) {
        this.markClass =
          this.theme !== "light" ? "measureWindow" : "measureWindow-light";
      }
    },

    //自动播放
    ifPlaying() {
      this.autoPlayHandle();
    },
    canvasNow() {
      this.ifPlaying = false;
    },
    viewportID() {
      this.ifPlaying = false;
    },
    imageData(val) {
      let { curImageNum, imageNum, curViewMod } = val;
      let showTotal = imageNum;
      let showCur = curImageNum;
      let { volumeSpacing } = this.seriesInfo;
      if (volumeSpacing) {
        let { d: dp, thickness } = volumeSpacing[curViewMod];
        let dimStep = Number((thickness / dp).toFixed(2));
        showTotal = Math.floor(imageNum / dimStep);
        showCur = Math.floor(curImageNum / dimStep);
      }
      // 自动播放不循环
      if (this.ifPlaying && showTotal === showCur + 1) {
        this.ifPlaying = false;
      }
    },
  },
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style lang="scss" scoped>
@import "./viewer-toolbar.scss";
@import "../../../assets/css/small.scss";
</style>
