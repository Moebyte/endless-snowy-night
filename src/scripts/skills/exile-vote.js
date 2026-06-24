/**
 * exile-vote.js - Public accusation voting logic
 * Depends on exile.js for shared helpers
 */
(function () {

  Game.exileVote = function (accuser, target) {
    var g = Game.ensureState();
    var voters = Game.exileActiveList().filter(function (id) {
      return id !== target;
    });

    var e = Game._exileEnsureExile(g);
    var targetRole = Game.roleOf(target);
    var targetIsWolf = GameState.WOLF_ROLES.indexOf(targetRole) !== -1;
    var accuserExposed = (accuser === 'fang_heng' && e.fangExposed);

    var votesFor = 0, votesAgainst = 0, abstains = 0;
    var voterLog = [];

    // Precompute Chen Mo's vote so Jiang Bai & Su Wan can follow it.
    // Chen Mo NEVER abstains — the player always makes a choice.
    var chenMoVoteResult = null;  // 'exile' | 'spare'
    if (g.alive['chen_mo'] && voters.indexOf('chen_mo') !== -1) {
      var _sAcc = (e.suspicion[accuser] || {})[target] || 0;
      var _pEvt = 0;
      var _evsCM = Game.getDayEvents(g.day);
      for (var _k = 0; _k < _evsCM.length; _k++) {
        if (_evsCM[_k].target === target || _evsCM[_k].b === target) _pEvt += _evsCM[_k].weight;
      }
      var _cmScore = _sAcc * 0.5 + _pEvt * 0.5 + (e.credit[accuser] || 0) * 0.2;
      // Jiang Bai's trap evidence is compelling — Chen Mo trusts physical proof
      if (accuser === 'jiang_bai' && g.traps && g.traps.lastObservedInjury === target) {
        _cmScore += 30;  // physical evidence boost
      }
      chenMoVoteResult = _cmScore > 45 ? 'exile' : 'spare';
    }

    for (var i = 0; i < voters.length; i++) {
      var v = voters[i];
      var vRole = Game.roleOf(v);
      var vIsWolf = GameState.WOLF_ROLES.indexOf(vRole) !== -1;
      var vote = 'abstain';  // default to abstain (three-state)
      var reason = '';

      if (v === accuser) {
        // Accuser votes exile (unless exposed -> abstain, nobody listens)
        vote = accuserExposed ? 'abstain' : 'exile';
        reason = accuserExposed ? 'accuser_exposed_abstain' : 'self_accuse';
      }
      // Chen Mo: player vote. NEVER abstains (player always chooses).
      else if (v === 'chen_mo') {
        vote = chenMoVoteResult !== null ? chenMoVoteResult : 'spare';
        reason = 'player_judgment';
      }
      // Su Wan: follow Chen Mo 65% (45% if Fang accuses).
      // Jiang Bai: NOW a tracked accuser with trap evidence, so he has his
      // own vote logic below. When he's a voter (not the accuser), he still
      // leans toward Chen Mo but has independent judgment from trap evidence.
      else if (v === 'su_wan') {
        if (chenMoVoteResult !== null) {
          var followRate = (accuser === 'fang_heng') ? 0.45 : 0.65;
          if (Math.random() < followRate) {
            vote = chenMoVoteResult;
            reason = 'follow_chen_mo';
          } else {
            vote = 'abstain';
            reason = 'no_opinion';
          }
        } else {
          vote = 'abstain';
          reason = 'lost_chenmo_anchor';
        }
      }
      // Jiang Bai as voter: if his trap caught the accused person, he votes
      // exile with high confidence (physical proof). Otherwise follows Chen Mo
      // but more independently than Su Wan (he's the pragmatic engineer).
      else if (v === 'jiang_bai') {
        var jbTrapMatch = false;
        if (g.traps && g.traps.lastObservedInjury === target) {
          jbTrapMatch = true;
        }
        if (jbTrapMatch) {
          // Trap evidence matches the accused — strong conviction
          vote = 'exile';
          reason = 'trap_evidence_match';
        } else if (chenMoVoteResult !== null) {
          var jbFollow = (accuser === 'fang_heng') ? 0.45 : 0.65;
          if (Math.random() < jbFollow) {
            vote = chenMoVoteResult;
            reason = 'follow_chen_mo';
          } else {
            vote = 'abstain';
            reason = 'no_opinion';
          }
        } else {
          vote = 'abstain';
          reason = 'lost_chenmo_anchor';
        }
      }
      // Wolves vote strategically.
      else if (vIsWolf) {
        if (targetIsWolf) {
          // Protect teammate — but smart wolves sometimes abstain to hide
          if ((v === 'zhao_mingcheng' || v === 'gu_yan') && Math.random() < 0.25) {
            vote = 'abstain';
            reason = 'wolf_hide_stance';
          } else {
            vote = 'spare';
            reason = 'wolf_protect_teammate';
          }
        } else {
          // Frame a good person — willingness varies by personality
          var blocWillingness = {
            zhao_mingcheng: 0.50,
            gu_yan: 0.55,
            zhou_yang: 0.85,
            tang_xiaotang: 0.75
          };
          var will = blocWillingness[v] !== undefined ? blocWillingness[v] : 0.7;
          if (v === 'tang_xiaotang' && g.day <= 3) will = 0.30;

          var roll = Math.random();
          if (roll < will) {
            vote = 'exile';
            reason = (v === 'tang_xiaotang' && g.day <= 3) ? 'tang_laying_low' : 'wolf_frame_good';
          } else if (roll < will + 0.20) {
            // Smart wolves sometimes abstain instead of openly opposing
            vote = 'abstain';
            reason = 'wolf_abstain_strategic';
          } else {
            vote = 'spare';
            reason = 'wolf_feign_neutral';
          }
        }
      }
      // Fang Heng: never abstains (cop instinct — he always has an opinion).
      else if (v === 'fang_heng') {
        var fSusp = (e.suspicion.fang_heng || {})[target] || 0;
        var fCred = e.credit[accuser] || 0;
        if (accuserExposed) fCred = 0;
        // Fang Heng gives weight to Jiang Bai's trap evidence (physical proof)
        if (accuser === 'jiang_bai' && g.traps && g.traps.lastObservedInjury === target) {
          fSusp += 35;
        }
        vote = (fSusp + fCred * 0.3) > 50 ? 'exile' : 'spare';
        reason = 'cop_instinct';
      }
      // Lin Xiaoman: rarely abstains (she always has strong feelings).
      // Only abstains if Tang hasn't hinted AND she has no personal read.
      else if (v === 'lin_xiaoman') {
        var lSusp = (e.suspicion.lin_xiaoman || {})[target] || 0;
        // Check Tang hint
        var tangHinted = false;
        var evsL = Game.getDayEvents(g.day);
        for (var li = 0; li < evsL.length; li++) {
          if (evsL[li].type === 'tang_hint' && evsL[li].target === target) { tangHinted = true; break; }
        }
        if (tangHinted) lSusp += 40;
        // Gold water for Lin too (she barely trusts Fang, but +45 is strong)
        if (typeof Game.prophetReceivedInfo === 'function') {
          var lGold = Game.prophetReceivedInfo('lin_xiaoman', target);
          if (lGold && lGold.result === 'hostile') lSusp += 45;
        }
        if (lSusp > 50) { vote = 'exile'; reason = tangHinted ? 'tang_hinted' : 'own_suspicion'; }
        else if (lSusp > 15) { vote = 'spare'; reason = 'insufficient_suspicion'; }
        else { vote = 'abstain'; reason = 'no_read'; }  // rare
      }
      // Ye Zhiqiu (witch): gentle, hesitant. Abstains when unsure.
      else if (v === 'ye_zhiqiu') {
        var ySusp = 0;
        // Ye Zhiqiu trusts Jiang Bai's physical trap evidence
        if (accuser === 'jiang_bai' && g.traps && g.traps.lastObservedInjury === target) {
          ySusp += 40;
        }
        var evsY = Game.getDayEvents(g.day);
        for (var yi = 0; yi < evsY.length; yi++) {
          if ((evsY[yi].target === target || evsY[yi].b === target) && evsY[yi].observer === 'ye_zhiqiu') {
            ySusp += evsY[yi].weight;
          }
        }
        // Silver water: if she revived this person, she trusts them -> spare
        var witchY = g.godSkills && g.godSkills.witch;
        if (witchY && witchY.revivedTargets && witchY.revivedTargets.indexOf(target) !== -1) {
          vote = 'spare'; reason = 'silver_water_trust';
        } else if (ySusp > 50) { vote = 'exile'; reason = 'observed_suspicion'; }
        else if (ySusp > 20) { vote = 'abstain'; reason = 'uncertain'; }  // gentle hesitation
        else { vote = 'abstain'; reason = 'no_opinion'; }
      }
      // Shen Shen (magician): gambler, hedges bets -> abstains often.
      else if (v === 'shen_shen') {
        var sSusp = 0;
        var evsS = Game.getDayEvents(g.day);
        for (var si = 0; si < evsS.length; si++) {
          if ((evsS[si].target === target || evsS[si].b === target)) sSusp += Math.floor(evsS[si].weight / 2);
        }
        if (sSusp > 55) { vote = 'exile'; reason = 'gambler_read'; }
        else if (sSusp > 30) { vote = 'abstain'; reason = 'hedging'; }
        else { vote = 'abstain'; reason = 'no_stake'; }
      }
      // Zheng Shoushan (old driver villager): not a detective, abstains often.
      else if (v === 'zheng_shoushan') {
        var zSusp = 0;
        var evsZ = Game.getDayEvents(g.day);
        for (var zi = 0; zi < evsZ.length; zi++) {
          if ((evsZ[zi].target === target || evsZ[zi].b === target) && evsZ[zi].observer === 'zheng_shoushan') {
            zSusp += evsZ[zi].weight;
          }
        }
        // Gold water helps — if Fang told him, he listens
        if (typeof Game.prophetReceivedInfo === 'function') {
          var zGold = Game.prophetReceivedInfo('zheng_shoushan', target);
          if (zGold && zGold.result === 'hostile') zSusp += 45;
        }
        if (zSusp > 50) { vote = 'exile'; reason = 'gold_water_or_observation'; }
        else if (zSusp > 25) { vote = 'abstain'; reason = 'insufficient_info'; }
        else { vote = 'abstain'; reason = 'just_a_driver'; }
      }
      // Generic good character (fallback)
      else {
        var gSusp = 0;
        var evsG = Game.getDayEvents(g.day);
        for (var gi = 0; gi < evsG.length; gi++) {
          if ((evsG[gi].target === target || evsG[gi].b === target) && evsG[gi].observer === v) {
            gSusp += evsG[gi].weight;
          }
        }
        // Gold water
        if (typeof Game.prophetReceivedInfo === 'function') {
          var gGold = Game.prophetReceivedInfo(v, target);
          if (gGold && gGold.result === 'hostile') { gSusp += 45; reason = 'gold_water'; }
        }
        var gCred = e.credit[accuser] || 0;
        if (accuserExposed) gCred = 0;
        var gTotal = gSusp + gCred * 0.3;
        if (gTotal > 50) { vote = 'exile'; if(!reason) reason = 'own_judgment'; }
        else if (gTotal > 20) { vote = 'abstain'; reason = 'uncertain'; }
        else { vote = 'abstain'; reason = 'no_opinion'; }
      }

      // Tally
      if (vote === 'exile') votesFor++;
      else if (vote === 'spare') votesAgainst++;
      else abstains++;
      voterLog.push({ id: v, vote: vote, reason: reason });
    }

    return { votesFor: votesFor, votesAgainst: votesAgainst, abstains: abstains, voters: voterLog };
  };

  // ---- Execute accusation + vote + exile ----

  Game.exileAccuse = function (accuser, target) {
    var g = Game.ensureState();
    var e = Game._exileEnsureExile(g);

    if (g.day === e.lastAccusationDay) return { ok: false, reason: 'already_accused_today' };
    if (!g.alive[accuser]) return { ok: false, reason: 'accuser_dead' };
    if (!g.alive[target]) return { ok: false, reason: 'target_dead' };
    if (Game.isExiled(target)) return { ok: false, reason: 'target_already_exiled' };
    if (accuser === 'fang_heng' && e.fangExposed) return { ok: false, reason: 'fang_exposed_cannot_accuse' };

    e.lastAccusationDay = g.day;

    var voteResult = Game.exileVote(accuser, target);

    // [v9.5] Ye Zhiqiu silver-water intervention (BEFORE final tally).
    // If the accused is the person she revived this round, she may publicly
    // veto. Her veto adds moral weight (3 spare votes) and EXPOSES her as
    // the witch -> wolves prioritize her tonight.
    var witchProtectTriggered = false;
    if (typeof Game.witchShouldProtect === "function" && Game.isAlive("ye_zhiqiu") && !Game.isExiled("ye_zhiqiu")) {
      if (Game.witchShouldProtect(target, voteResult)) {
        var wWeight = Game.witchProtectVoteWeight();
        voteResult.votesAgainst += wWeight;
        witchProtectTriggered = true;
        Game.revealInfo("ye_zhiqiu", "witch_exposed");
        if (!g.flags) g.flags = {};
        g.flags["ye_zhiqiu_exposed"] = true;
        voteResult.voters.push({ id: "ye_zhiqiu", vote: "spare", reason: "silver_water_veto", weight: wWeight });
      }
    }

    // [v9.3.2] SIMPLE MAJORITY: exile succeeds if votesFor > votesAgainst.
    // Abstains do NOT count. Even 2:1 exile wins. Silence = passive acceptance.
    var exiled = voteResult.votesFor > voteResult.votesAgainst;

    // [v9.3.2] CHEN MO TIE-BREAKER: if it's a tie (votesFor === votesAgainst)
    // and Chen Mo voted exile, his vote breaks the tie -> exile succeeds.
    // This gives the player decisive influence in close votes.
    var swingTriggered = false;
    if (!exiled && voteResult.votesFor === voteResult.votesAgainst && voteResult.votesFor > 0) {
      var chenMoVotedExile = voteResult.voters.some(function (vt) {
        return vt.id === 'chen_mo' && vt.vote === 'exile';
      });
      if (chenMoVotedExile) {
        exiled = true;
        swingTriggered = true;
      }
    }


    // Accuser pays credibility (failed accusations cost more).
    var cost = exiled ? 15 : 25;
    if (accuser === 'zhao_mingcheng') cost = Math.floor(cost * 0.7);
    e.credit[accuser] = Math.max(0, (e.credit[accuser] || 0) - cost);

    var record = {
      day: g.day,
      loop: g.loop,
      accuser: accuser,
      target: target,
      votesFor: voteResult.votesFor,
      votesAgainst: voteResult.votesAgainst,
      abstains: voteResult.abstains,
      exiled: exiled,
      voters: voteResult.voters
    };
    e.history.push(record);

    // [v9.3-C] Track vote patterns for bloc-detection backfire.
    Game.exileRecordVotePattern(voteResult, target, exiled);

    if (exiled) {
      e.exiled[target] = true;
      // Clear pending god-skill state involving them (e.g. knight guarding).
      if (g.godSkills && g.godSkills.knight && g.godSkills.knight.guarding === target) {
        g.godSkills.knight.guarding = null;
      }
    }

    return {
      ok: true,
      reason: exiled ? 'exiled' : 'spared',
      accuser: accuser,
      target: target,
      votesFor: voteResult.votesFor,
      votesAgainst: voteResult.votesAgainst,
      abstains: voteResult.abstains,
      exiled: exiled,
      swingTriggered: swingTriggered,
      witchProtectTriggered: witchProtectTriggered
    };
  };

  // ---- AI: run the daytime accusation phase (at most one per day) ----
  // Priority: Jiang Bai (physical trap evidence) > Lin Xiaoman > Fang Heng > Zhao Mingcheng > Gu Yan.
  // Jiang Bai's trap evidence is a hard physical fact, so it takes precedence
  // over everyone else's suspicion/intuition/framing. When he has no evidence,
  // he simply doesn't participate and the normal order runs.
})();
