/*
 * @Author: 
 * @Date: 2024-03-16 00:32:58
 * @LastEditTime: 2024-03-19 15:59:03
 * @LastEditors: ssy
 * @Description: 
 */
import ClickOpt from "@/components/multiviewer/js/clickOpt";
import DATA from "@/components/multiviewer/js/data";
import CROSS from "@/components/multiviewer/js/crosshair";

export default {
	gridMod(that, value) {
		const cvp = that.currViewport;

		cvp.gridMod = value;


		switch (value) {
			case "MPR3": {
				cvp.gridNum = "3.1";
				that.changeCurrGridNum();

				for (let i = 0; i < cvp.imageDatas.length; i++) {
					this.changeViewMod(cvp, i, i);
				}
				that.$nextTick(() => {
					that.activeOpt="ACross"
				})
				break;
	
			}
		}
		
	},

	changeViewMod(cvp, index, viewMod) {
		let imageData = cvp.imageDatas[index];
		let seriesInfo = cvp.seriesInfos[index];
		imageData.curViewMod = viewMod;
		imageData.rotate = 0
		imageData.translate.x = 0
		imageData.translate.y = 0
		imageData = CROSS.asyncImageData(imageData, cvp.AcrossPoint, seriesInfo)
		cvp.imageDatas.splice(index, 1, {...imageData});
	},
}
