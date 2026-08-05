const { test, expect } = require('@playwright/test');

const PRE = () => {
  try { localStorage.clear(); localStorage.setItem('ironTideTutorialDone', '1'); } catch (e) {}
  const b = document.getElementById('storyBtn'), s = document.getElementById('story');
  if (b && s && s.style.display === 'flex') b.click();
};

// Picking a weapon in the armory raises a translucent green cylinder on the deck showing where it
// would go. selectedWeapon was assigned in exactly one place and cleared in NONE — so once you
// touched the armory that marker followed your view for the rest of the battle, including long
// after the gun was already bolted down. There was no key, no button and no click that removed it.
test('the green mount marker can be put away again', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.waitForFunction(() => typeof startGame === 'function' && typeof updateMountPreview === 'function');
  const r = await page.evaluate(([PRE_SRC]) => {
    eval('(' + PRE_SRC + ')()');
    difficulty = 'easy'; currentSandboxIdx = -1; currentMapIdx = 4;
    startGame('destroyer'); skipBanner();
    money = 99999;

    // walking the deck is where the ghost shows
    const onDeck = () => { driving = false; manning = null; piloting = null;
      onFoot = false; drivingTank = false; shopOpen = false; };
    const ghostUp = () => { onDeck(); updateMountPreview(); return !!(_mountGhost && _mountGhost.visible); };

    const before = ghostUp();                       // nothing selected yet
    selectedWeapon = 'deckgun';
    const afterPick = ghostUp();

    // (1) Esc puts it back — the same chain that closes every other panel
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Escape' }));
    const afterEsc = ghostUp(); const selAfterEsc = selectedWeapon;

    // (2) and clicking the same weapon twice in the armory toggles it
    if (!shopOpen) toggleShop();
    SHOP_SHOW_ALL.guns = true; shopTab = 'guns'; buildShopUI();
    const card = document.querySelector('.witem[data-id="deckgun"]');
    card.click();  const selAfterFirstClick = selectedWeapon;
    card.click();  const selAfterSecondClick = selectedWeapon;
    const afterToggle = ghostUp();

    // ...and it still WORKS: picking again must put the marker back up, not stay dead
    card.click();
    const afterRepick = ghostUp();
    return { before, afterPick, afterEsc, selAfterEsc, selAfterFirstClick, selAfterSecondClick,
             afterToggle, afterRepick,
             ghostIsGreen: _mountGhost ? '#' + _mountGhost.material.color.getHexString() : null };
  }, [PRE.toString()]);

  expect(r.ghostIsGreen).toBe('#4ade80');            // this really is the green cylinder in question
  expect(r.before).toBe(false);                      // nothing selected, nothing shown
  expect(r.afterPick).toBe(true);                    // ...and picking a gun raises it, as designed

  // Esc puts the weapon back down and the marker with it
  expect(r.selAfterEsc).toBeNull();
  expect(r.afterEsc).toBe(false);

  // clicking the selected weapon a second time does the same
  expect(r.selAfterFirstClick).toBe('deckgun');
  expect(r.selAfterSecondClick).toBeNull();
  expect(r.afterToggle).toBe(false);

  // and none of this broke picking one up again
  expect(r.afterRepick).toBe(true);
});

// Esc has a priority chain — it closes the topmost open panel first. Putting the weapon down must
// join that chain WITHOUT jumping the queue, or Esc would stop closing the armory.
test('Esc still closes an open panel before it puts the weapon down', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.waitForFunction(() => typeof startGame === 'function');
  const r = await page.evaluate(([PRE_SRC]) => {
    eval('(' + PRE_SRC + ')()');
    difficulty = 'easy'; currentSandboxIdx = -1; currentMapIdx = 4;
    startGame('destroyer'); skipBanner();
    selectedWeapon = 'deckgun';
    if (!shopOpen) toggleShop();
    // one press = ONE dispatch. The game listens on window (index.html:4957); firing on window
    // and document as well ran the handler twice and ate two steps of the Esc chain per "press".
    const esc = () => window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Escape' }));

    esc();  // should close the shop and leave the weapon in hand
    const afterFirst = { shopOpen, selectedWeapon };
    esc();  // now the weapon goes back
    const afterSecond = { shopOpen, selectedWeapon };
    return { afterFirst, afterSecond };
  }, [PRE.toString()]);

  expect(r.afterFirst.shopOpen).toBe(false);
  expect(r.afterFirst.selectedWeapon).toBe('deckgun');   // the panel had priority, as before
  expect(r.afterSecond.selectedWeapon).toBeNull();
});
