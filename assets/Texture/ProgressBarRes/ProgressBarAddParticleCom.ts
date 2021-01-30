import { ParticlePositionMap } from "./ParticlePositionMap"; //useConfig = false 生成的粒子位置配置

const { ccclass, property } = cc._decorator;

type ActionArg = { duration: number, start: cc.Vec2, end: cc.Vec2 } //粒子运动参数
type ParticlePositionMap = { [progress: number]: cc.Vec2 } //粒子位置配置

@ccclass
export default class ProgressBarAddParticleCom extends cc.Component {

    @property(cc.PolygonCollider) polygonCollider: cc.PolygonCollider = null; //使用多边形碰撞中的边界点
    @property(cc.ProgressBar) progressBar: cc.ProgressBar = null //进度条
    @property(cc.ParticleSystem) particle: cc.ParticleSystem = null //粒子
    @property(Number) firstIndex: Number = 0 //粒子初始位置 在多边形碰撞中的边界对应的点

    private readonly progressBarDuration = 10
    private particlePositionMap: ParticlePositionMap = {}

    private readonly useConfig = false  //是否使用配置文件
    onLoad() {
        this.updateProgressBar()
        this.useConfig || this.particleAction()
    }

    //进度条
    private progressBarScheduleFunc: Function
    private currProgress = 0
    private updateProgressBar() {
        this.schedule(this.progressBarScheduleFunc = () => {
            this.currProgress += 0.01
            if (this.currProgress >= 1) {
                this.unschedule(this.progressBarScheduleFunc)
                this.useConfig || console.log('this.particlePositionMap', JSON.stringify(this.particlePositionMap)) //拷贝这个输出 保存成配置文件
            }
            this.progressBar.progress = this.currProgress

            if (!this.useConfig) {
                //保存一下粒子在不同进度下的位置
                this.particlePositionMap[this.currProgress] = this.particle.node.position.clone()
            } else {
                //使用配置文件更新粒子位置
                this.updateParticlePosition(this.currProgress)
            }
        }, 0.1, cc.macro.REPEAT_FOREVER)
    }

    //粒子运动
    private particleAction() {
        //点按照进度条运动方向排序
        let pointList = this.polygonCollider.points.slice()
        console.log('pointList', pointList)
        let doubleList = pointList.concat(pointList.slice())
        let sortList: cc.Vec2[] = []
        for (let index = 0; index < doubleList.length; index++) {
            const curr = doubleList[index];
            if (index >= this.firstIndex && sortList.length < doubleList.length / 2) {
                sortList.push(curr)
            }
        }
        console.log('sortList', sortList)

        //生成动作参数
        let actionArgs: ActionArg[] = []
        for (let index = 0; index < sortList.length; index++) {
            let curr = sortList[index];
            let next = sortList[index + 1 <= sortList.length - 1 ? index + 1 : 0]
            let anlge = cc.pAngle(curr, next)
            let duration = anlge / cc.macro.PI2 * this.progressBarDuration //根据角速度算出对应时间段的时间
            actionArgs.push({ duration: duration, start: curr, end: next })
        }
        console.log('actionArgs', actionArgs)
        let acitons = []
        for (const arg of actionArgs) {
            acitons.push(cc.moveTo(arg.duration, arg.end))
        }
        this.particle.node.position = actionArgs[0].start.clone() //粒子初始位置 和进度条初始位置相同
        this.particle.node.runAction(cc.sequence(acitons))
    }

    //粒子位置更新
    private updateParticlePosition(progress: number) {
        let position: cc.Vec2 = ParticlePositionMap[progress + '']
        if (position) {
            console.log(`progress:${progress}=>position:${position}`)
            this.particle.node.setPosition(position)
        }
    }
}
