/*
 * @Author:
 * @Date: 2024-04-02 14:29:00
 * @LastEditTime: 2024-04-07 13:47:15
 * @LastEditors: ssy
 * @Description:
 */
// dataWithInfo
class dwi_item {
  constructor(para = {}) {
    //w和h方向的方位信息
    this.eW = para.eW || [1, 0, 0];
    this.eH = para.eH || [1, 0, 0];
    this.pW = para.pW || 1;
    this.pH = para.pH || 1;
    this.width = para.width || 1;
    this.heigth = para.heigth || 1;
    this.leftTopPos = para.leftTopPos || [0, 0, 0];
    this.imgorient = para.imgorient || [
      [1, 0, 0],
      [0, 1, 0],
      [0, 0, -1],
    ];
  }
}

export default dwi_item;
