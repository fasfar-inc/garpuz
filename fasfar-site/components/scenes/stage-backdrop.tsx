/**
 * Painted (CSS-only) backgrounds behind the WebGL canvas: the warm ivory
 * studio for Scene 1 and the midnight horizon for Scene 2. The stage
 * timeline cross-fades and parallaxes them via the data attributes.
 */
export function StageBackdrop() {
  return (
    <div aria-hidden="true" className="absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-[#f1ede6]" />
      <div data-ivory-decor className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(70%_60%_at_52%_38%,#fbf9f5_0%,rgba(251,249,245,0)_70%)]" />
        <div className="absolute left-1/2 top-[-6%] h-[78%] w-[min(46vw,620px)] -translate-x-[42%] rounded-[50%] bg-[radial-gradient(closest-side,rgba(206,200,190,0.55),rgba(222,217,209,0.25)_65%,rgba(241,237,230,0))] blur-2xl" />
        <div className="absolute bottom-[9%] left-1/2 h-[9%] w-[min(60vw,820px)] -translate-x-1/2 rounded-[50%] bg-[radial-gradient(closest-side,rgba(120,108,95,0.28),rgba(120,108,95,0))] blur-xl" />
      </div>

      <div data-night className="invisible absolute inset-0 opacity-0">
        <div className="absolute inset-0 bg-[radial-gradient(90%_70%_at_55%_-5%,#2a3f6e_0%,#14244d_34%,#0a1430_62%,#060b1d_100%)]" />
        <div
          data-planet
          className="absolute right-[-22vw] top-[-30vw] aspect-square w-[78vw] rounded-full bg-[radial-gradient(circle_at_28%_72%,#1c3061_0%,#0d1838_55%,#091230_100%)] shadow-[inset_18px_-18px_70px_rgba(150,180,255,0.28),0_0_120px_rgba(80,110,200,0.18)] md:right-[-12vw] md:top-[-24vw] md:w-[52vw]"
        />
        <div className="absolute left-[30%] top-0 h-[60%] w-[30%] bg-[radial-gradient(closest-side,rgba(150,175,235,0.18),rgba(150,175,235,0))] blur-2xl" />
        <div data-horizon className="absolute inset-x-0 bottom-0 h-[42%]">
          <div className="absolute bottom-[-150%] left-1/2 h-[230%] w-[230vw] -translate-x-1/2 rounded-[50%] bg-[radial-gradient(ellipse_at_50%_0%,#2c3a5d_0%,#0d1630_28%,#060a18_60%)] shadow-[0_-1px_0_rgba(205,218,255,0.45),0_-30px_90px_rgba(140,165,230,0.32)] md:w-[160vw]" />
          <div className="absolute bottom-[38%] left-[12%] h-[30%] w-[38%] bg-[radial-gradient(closest-side,rgba(255,214,170,0.35),rgba(255,214,170,0))] blur-xl" />
          <div className="absolute bottom-[34%] right-[4%] h-[26%] w-[30%] bg-[radial-gradient(closest-side,rgba(200,215,255,0.22),rgba(200,215,255,0))] blur-xl" />
        </div>
      </div>
    </div>
  );
}
