/*
 * @Author:
 * @Date: 2024-09-24 12:47:04
 * @LastEditTime: 2024-11-19 15:20:20
 * @LastEditors: ssy
 * @Description:
 */
const IMGPRO = {
  //获取8邻域
  get26Neighbor(x, y, z, dx, dy, dz) {
    const neibours = [];
    let length = dx * dy;
    for (let i = -1; i < 2; i++) {
      for (let j = -1; j < 2; j++) {
        for (let k = -1; k < 2; k++) {
          if (i === 0 && j === 0 && k === 0) continue;
          if (
            x + i >= 0 &&
            x + i < dx &&
            y + j >= 0 &&
            y + j < dy &&
            z + k >= 0 &&
            z + k < dz
          ) {
            let index = x + i + (y + j) * dx + (z + k) * length;
            neibours.push(index);
          }
        }
      }
    }
    return neibours;
  },

  //3D膨胀
  dilate3D(binaries, size) {
    let dx = size[0],
      dy = size[1],
      dz = size[2];
    let newBinaries = new Uint8Array(dx * dy * dz).fill(0);
    for (let i = 1; i < dx - 1; i++) {
      for (let j = 1; j < dy - 1; j++) {
        for (let k = 1; k < dz - 1; k++) {
          if (binaries[i + j * dx + k * dx * dy] > 0) {
            let neibours = this.get26Neighbor(i, j, k, dx, dy, dz);
            for (let n = 0; n < neibours.length; n++) {
              newBinaries[neibours[n]] = 255;
            }
          }
        }
      }
    }
    binaries = null;
    return newBinaries;
  },

  volumeToImage(volume, size) {
    let [dx, dy, dz] = size;
    let length = dx * dy;
    //弹出一个新窗口

    const newWindow = window.open(
      "",
      "测试结果",
      "width=530,height=530,alwaysRaised=yes,depended=yes",
    );
    newWindow.document.write(
      "<!DOCTYPE html><html><head><title>Canvas Display</title></head><body></body></html>",
    );
    newWindow.document.close();

    let kMax = 100;
    if (dz < kMax) kMax = dz;
    for (let k = 0; k < kMax; k++) {
      let img = new Uint8ClampedArray(dx * dy * 4).fill(0);
      let canvas = newWindow.document.createElement("canvas");
      newWindow.document.body.appendChild(canvas);
      canvas.width = dx;
      canvas.height = dy;
      let ctx = canvas.getContext("2d");
      let imageData = ctx.createImageData(dx, dy);
      for (let j = 0; j < dy; j++) {
        for (let i = 0; i < dx; i++) {
          let index = i + j * dx + k * length;
          if (volume[index] > 0) {
            let newInd = 4 * (i + j * dx);
            img[newInd] = 255;
            img[newInd + 1] = 255;
            img[newInd + 2] = 255;
            img[newInd + 3] = 255;
          } else {
            let newInd = 4 * (i + j * dx);
            img[newInd] = 0;
            img[newInd + 1] = 0;
            img[newInd + 2] = 0;
            img[newInd + 3] = 255;
          }
        }
      }
      //保存成png
      imageData.data.set(img);
      ctx.putImageData(imageData, 0, 0);
      //写一个标题
      ctx.font = "20px Arial";
      ctx.fillStyle = "red";
      ctx.fillText(`z:${k}`, 10, 20);
    }
  },

  findIslands(volume, size, threshhold, visited) {
    const [dx, dy, dz] = size;
    const length = dx * dy;
    const indexMax = dx * dy * dz - 1;

    let islands = {
      islandNumber: 0,
      islandNumberSize: [],
    };

    function index(x, y, z) {
      return x + dx * y + length * z; // 计算一维数组中的索引
    }
    //标记边界，用最大像素值标记
    for (let z = 0; z < dz; z++) {
      let dicj = [0, dy - 1];
      for (let j = 0; j < 2; j++) {
        for (let i = 0; i < dx; i++) {
          let idx = index(i, dicj[j], z);
          visited[idx] = indexMax;
        }
      }
      let dici = [0, dx - 1];
      for (let i = 0; i < 2; i++) {
        for (let j = 0; j < dy; j++) {
          let idx = index(dici[i], j, z);
          visited[idx] = indexMax;
        }
      }
    }

    function dfs(index, labelValue, islands) {
      //手动维护一个栈
      let stack = [index];
      while (stack.length > 0) {
        let idx = stack.pop();
        // 边界检查
        if (idx < 0 || idx > indexMax) continue;
        // 已访问或为背景区
        if (visited[idx] || !(volume[idx] > threshhold)) continue;

        // 使用labelValue标记为已访问并计数
        visited[idx] = labelValue;
        islands.islandNumberSize[labelValue]++;
        try {
          stack.push(idx - 1);
          stack.push(idx + 1);
          stack.push(idx - dx);
          stack.push(idx + dx);
          stack.push(idx + length);
          stack.push(idx - length);
        } catch (e) {
          console.log(e);
          console.log("idx:", idx, stack.length);
          return;
        }
      }
    }

    let labelValue = 0;
    islands.islandNumberSize[labelValue] = 0;
    for (let z = 0; z < dz; z++) {
      for (let y = 1; y < dy; y++) {
        for (let x = 1; x < dx; x++) {
          let idx = index(x, y, z);
          if (volume[idx] > threshhold && !visited[idx]) {
            labelValue++; // 增加联通体的计数
            islands.islandNumberSize[labelValue] = 0;
            dfs(idx, labelValue, islands); // 发现新的联通体
          }
        }
      }
    }
    islands.islandNumber = labelValue;
    islands.islandBinaries = visited;
    return islands;
  },

  //保留最大的联通区域
  keepLargestIsland(volume, size, threshhold) {
    const [dx, dy, dz] = size;
    const mask = new Int16Array(dx * dy * dz).fill(0);
    const islands = this.findIslands(volume, size, threshhold, mask);
    let maxNumber = -Infinity;
    islands.islandNumberSize.forEach((item) => {
      if (item > maxNumber) {
        maxNumber = item;
      }
    });
    const maxNumLabel = islands.islandNumberSize.indexOf(maxNumber);
    console.log(
      "tabelRemove islands:",
      islands,
      `label:${maxNumLabel},counts:${maxNumber}`,
    );
    if (maxNumLabel != dx * dy * dz - 1) {
      for (let i = 0; i < mask.length; i++) {
        if (mask[i] === maxNumLabel) {
          mask[i] = 255;
        } else {
          mask[i] = 0;
        }
      }
    }
    return islands;
  },

  fillHole(volume, size, mask) {
    const [dx, dy, dz] = size;
    const length = dx * dy;
    const indexMax = dx * dy * dz - 1;

    function index(x, y, z) {
      return x + dx * y + length * z; // 计算一维数组中的索引
    }

    //标记边界
    for (let z = 0; z < dz; z++) {
      let dicj = [0, dy - 1];
      for (let j = 0; j < 2; j++) {
        for (let i = 0; i < dx; i++) {
          let idx = index(i, dicj[j], z);
          mask[idx] = 0;
        }
      }
      let dici = [0, dx - 1];
      for (let i = 0; i < 2; i++) {
        for (let j = 0; j < dy; j++) {
          let idx = index(dici[i], j, z);
          mask[idx] = 0;
        }
      }
    }

    //查找背景
    function dfb(index) {
      let stack = [index];
      while (stack.length > 0) {
        let idx = stack.pop();
        if (idx < 0 || idx > indexMax) continue;

        //volume[idx]为true,触到有值点
        if (!mask[idx] || volume[idx]) continue;
        mask[idx] = 0;

        // 探索6邻域
        stack.push(idx - 1);
        stack.push(idx + 1);
        stack.push(idx - dx);
        stack.push(idx + dx);
        stack.push(idx + length);
        stack.push(idx - length);
      }
    }

    //只查找第一个背景点
    let isContinue = true;
    for (let z = 0; z < dz && isContinue; z++) {
      for (let y = 1; y < dy && isContinue; y++) {
        for (let x = 1; x < dx && isContinue; x++) {
          let idx = index(x, y, z);
          if (!volume[idx]) {
            dfb(idx);
            isContinue = false;
          }
        }
      }
    }
  },

  //降采样
  // 三线性插值
  downsamplinVolume(buffer, volumeSize) {
    let [dx, dy, dz] = volumeSize;
    let newVolume = new Int16Array(dx * dy * dz);
    let [nx, ny, nz] = [
      Math.floor(dx / 2),
      Math.floor(dy / 2),
      Math.floor(dz / 2) + 1,
    ];
    let lengthOrg = dx * dy;
    let lengthNew = nx * ny;
    for (let k = 0; k < nz - 1; k++) {
      for (let j = 0; j < ny; j++) {
        for (let i = 0; i < nx; i++) {
          let index = i + j * nx + k * lengthNew;
          let index1 = 2 * i + 2 * j * dx + 2 * k * lengthOrg;
          let index2 = 2 * i + 2 * j * dx + (2 * k + 1) * lengthOrg;
          let index3 = 2 * i + (2 * j + 1) * dx + 2 * k * lengthOrg;
          let index4 = 2 * i + (2 * j + 1) * dx + (2 * k + 1) * lengthOrg;
          let index5 = 2 * i + 1 + 2 * j * dx + 2 * k * lengthOrg;
          let index6 = 2 * i + 1 + 2 * j * dx + (2 * k + 1) * lengthOrg;
          let index7 = 2 * i + 1 + (2 * j + 1) * dx + 2 * k * lengthOrg;
          let index8 = 2 * i + 1 + (2 * j + 1) * dx + (2 * k + 1) * lengthOrg;
          newVolume[index] =
            (buffer[index1] +
              buffer[index2] +
              buffer[index3] +
              buffer[index4] +
              buffer[index5] +
              buffer[index6] +
              buffer[index7] +
              buffer[index8]) /
            8;
        }
      }
    }
    let kn = nz - 1,
      ko = nz - 2;
    for (let j = 0; j < ny; j++) {
      for (let i = 0; i < nx; i++) {
        //拷贝最后一层
        let index = i + j * nx + kn * lengthNew;
        let index1 = i + j * nx + ko * lengthNew;
        newVolume[index] = newVolume[index1];
      }
    }
    return { newVolume, newSize: [nx, ny, nz] };
  },
  //上采样
  upsamplingMapList(mapList, volumeSize) {
    let [dx, dy, dz] = volumeSize;
    let [nx, ny, nz] = [
      Math.floor(dx / 2),
      Math.floor(dy / 2),
      Math.floor(dz / 2),
    ];
    let orgMapList = new Uint8Array(dx * dy * dz).fill(0);
    let lengthOrg = dx * dy;
    let lengthNew = nx * ny;
    for (let k = 0; k < dz; k++) {
      for (let j = 0; j < dy; j++) {
        for (let i = 0; i < dx; i++) {
          let index = i + j * dx + k * lengthOrg;
          let index1 =
            Math.floor(i / 2) +
            Math.floor(j / 2) * nx +
            Math.floor(k / 2) * lengthNew;
          orgMapList[index] = mapList[index1];
        }
      }
    }
    mapList = null;
    return orgMapList;
  },

  upsamplingMapList_scale(
    mapList,
    arr,
    minCubeSize,
    edge,
    [dx, dy, dz],
    scale,
  ) {
    let len = dx * dy;
    for (let i = 0; i < minCubeSize[0]; i++) {
      for (let j = 0; j < minCubeSize[1]; j++) {
        for (let k = 0; k < minCubeSize[2]; k++) {
          if (!arr[k][j][i]) {
            let index =
              i * scale +
              edge[0] +
              (j * scale + edge[2]) * dx +
              (k * scale + edge[4]) * len;
            for (let m = 0; m < scale; m++) {
              for (let n = 0; n < scale; n++) {
                for (let p = 0; p < scale; p++) {
                  let newIndex = index + m + n * dx + p * len;
                  mapList[newIndex] = 0;
                }
              }
            }
          }
        }
      }
    }
    // for (let k = 0; k < dz - 1; k += scale) {
    //   for (let j = 0; j < dy - 1; j += scale) {
    //     for (let i = 0; i < dx - 1; i += scale) {
    //       let index = i + j * dx + k * len;
    //       if (!mapList[index]) {
    //       }
    //     }
    //   }
    // }
  },
};

export default IMGPRO;
