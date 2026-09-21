import { DialogueSynthesizer } from '../DialogueSynthesizer';

describe('DialogueSynthesizer (Multilingual & Emergency Semantic Layer)', () => {
  it('returns empty sentence for empty tokens', () => {
    const res = DialogueSynthesizer.synthesize([], 'hospital', 'en');
    expect(res.sentence).toBe('');
    expect(res.isEmergency).toBe(false);
  });

  it('triggers emergency triage protocol when PAIN is present', () => {
    const resEn = DialogueSynthesizer.synthesize(['PAIN'], 'hospital', 'en');
    expect(resEn.isEmergency).toBe(true);
    expect(resEn.sentence).toContain('Emergency');

    const resHi = DialogueSynthesizer.synthesize(['PAIN', 'HELP'], 'hospital', 'hi');
    expect(resHi.isEmergency).toBe(true);
    expect(resHi.sentence).toContain('आपातकालीन');

    const resTe = DialogueSynthesizer.synthesize(['PAIN'], 'hospital', 'te');
    expect(resTe.isEmergency).toBe(true);
    expect(resTe.sentence).toContain('అత్యవసరం');
  });

  it('triggers acute emergency protocols for CHEST-PAIN, BREATHING, and AMBULANCE', () => {
    const chestRes = DialogueSynthesizer.synthesize(['CHEST-PAIN'], 'hospital', 'en');
    expect(chestRes.isEmergency).toBe(true);
    expect(chestRes.sentence).toContain('chest pain');

    const breathRes = DialogueSynthesizer.synthesize(['BREATHING'], 'hospital', 'hi');
    expect(breathRes.isEmergency).toBe(true);
    expect(breathRes.sentence).toContain('सांस');

    const ambRes = DialogueSynthesizer.synthesize(['AMBULANCE'], 'hospital', 'te');
    expect(ambRes.isEmergency).toBe(true);
    expect(ambRes.sentence).toContain('అంబులెన్స్');
  });

  it('synthesizes English compound medicine prescription requests', () => {
    const res = DialogueSynthesizer.synthesize(['MEDICINE', 'PRESCRIPTION'], 'hospital', 'en');
    expect(res.sentence).toBe('Hello, could you please help me refill my prescription medication?');
    expect(res.isEmergency).toBe(false);
  });

  it('synthesizes Hindi compound medicine prescription requests', () => {
    const res = DialogueSynthesizer.synthesize(['MEDICINE', 'PRESCRIPTION'], 'hospital', 'hi');
    expect(res.sentence).toContain('दवाई');
    expect(res.language).toBe('hi');
  });

  it('synthesizes Telugu compound medicine prescription requests', () => {
    const res = DialogueSynthesizer.synthesize(['MEDICINE', 'PRESCRIPTION'], 'hospital', 'te');
    expect(res.sentence).toContain('మందులు');
    expect(res.language).toBe('te');
  });

  it('synthesizes fingerspelled medicine names seamlessly', () => {
    const res = DialogueSynthesizer.synthesize(['MEDICINE', '#METFORMIN'], 'hospital', 'en');
    expect(res.sentence).toBe('Hello, I need to collect my prescribed Metformin medication, please.');
  });

  it('synthesizes token slip numbers accurately', () => {
    const res = DialogueSynthesizer.synthesize(['TOKEN', '#42'], 'hospital', 'en');
    expect(res.sentence).toBe('Hello, my service token number is 42.');

    const resHi = DialogueSynthesizer.synthesize(['TOKEN', '#42'], 'hospital', 'hi');
    expect(resHi.sentence).toContain('टोकन नंबर 42');
  });

  it('synthesizes cash deposit with specified amounts', () => {
    const res = DialogueSynthesizer.synthesize(['CASH', 'DEPOSIT', '#500'], 'bank', 'en');
    expect(res.sentence).toBe('Hello, I would like to deposit 500 rupees into my account, please.');
  });

  it('synthesizes bank account issues', () => {
    const res = DialogueSynthesizer.synthesize(['ACCOUNT', 'PROBLEM'], 'bank', 'en');
    expect(res.sentence).toContain('bank account');
  });

  it('synthesizes appointments', () => {
    const res = DialogueSynthesizer.synthesize(['APPOINTMENT'], 'general', 'en');
    expect(res.sentence).toContain('appointment');
  });

  it('synthesizes civic Aadhaar updates', () => {
    const res = DialogueSynthesizer.synthesize(['AADHAAR'], 'civic', 'en');
    expect(res.sentence).toContain('Aadhaar');
  });

  it('synthesizes police complaint and lost items', () => {
    const res = DialogueSynthesizer.synthesize(['POLICE', 'LOST'], 'general', 'en');
    expect(res.sentence).toContain('lost personal item');
  });

  it('synthesizes education classroom lecture and exam doubts', () => {
    const resEn = DialogueSynthesizer.synthesize(['QUESTION', 'EXAM'], 'education', 'en');
    expect(resEn.sentence).toContain('examination');

    const resHi = DialogueSynthesizer.synthesize(['QUESTION', 'EXAM'], 'education', 'hi');
    expect(resHi.sentence).toContain('परीक्षा');

    const resTe = DialogueSynthesizer.synthesize(['QUESTION', 'EXAM'], 'education', 'te');
    expect(resTe.sentence).toContain('పరీక్ష');
  });

  it('synthesizes workplace meeting and project updates', () => {
    const res = DialogueSynthesizer.synthesize(['PROJECT', 'MEETING'], 'workplace', 'en');
    expect(res.sentence).toContain('project progress');
  });

  it('synthesizes travel train platform and flight gate inquiries', () => {
    const trainRes = DialogueSynthesizer.synthesize(['TRAIN', 'PLATFORM'], 'transit', 'en');
    expect(trainRes.sentence).toContain('platform');

    const flightRes = DialogueSynthesizer.synthesize(['FLIGHT', 'AIRPORT'], 'transit', 'te');
    expect(flightRes.sentence).toContain('బోర్డింగ్ గేట్');
  });

  it('synthesizes retail pricing and dining orders', () => {
    const priceRes = DialogueSynthesizer.synthesize(['PRICE', 'DISCOUNT'], 'retail', 'en');
    expect(priceRes.sentence).toContain('discount');

    const orderRes = DialogueSynthesizer.synthesize(['TEA', 'BILL'], 'retail', 'hi');
    expect(orderRes.sentence).toContain('बिल');
  });

  it('synthesizes social family and friendship greetings', () => {
    const famRes = DialogueSynthesizer.synthesize(['FAMILY', 'HOME'], 'social', 'en');
    expect(famRes.sentence).toContain('family');

    const happyRes = DialogueSynthesizer.synthesize(['FRIEND', 'HAPPY'], 'social', 'te');
    expect(happyRes.sentence).toContain('సంతోషంగా');
  });

  it('synthesizes thank you gestures', () => {
    const res = DialogueSynthesizer.synthesize(['THANK-YOU'], 'general', 'te');
    expect(res.sentence).toContain('ధన్యవాదాలు');
  });

  describe('Delivery & Transit Call Protocols (Zomato / Swiggy / Uber)', () => {
    it('synthesizes left gate direction in English, Hindi, and Telugu', () => {
      const en = DialogueSynthesizer.synthesize(['GATE_LEFT'], 'delivery', 'en');
      expect(en.sentence).toContain('left turn at the main society gate');

      const hi = DialogueSynthesizer.synthesize(['GATE_LEFT'], 'delivery', 'hi');
      expect(hi.sentence).toContain('बाएं मुड़ें');

      const te = DialogueSynthesizer.synthesize(['GATE_LEFT'], 'delivery', 'te');
      expect(te.sentence).toContain('ఎడమవైపుకి తిరగండి');
    });

    it('synthesizes leave at door in trilingual mode', () => {
      const en = DialogueSynthesizer.synthesize(['DOOR'], 'delivery', 'en');
      expect(en.sentence).toContain('leave the package at the door');

      const hi = DialogueSynthesizer.synthesize(['LEAVE_AT_DOOR'], 'delivery', 'hi');
      expect(hi.sentence).toContain('दरवाजे के बाहर');

      const te = DialogueSynthesizer.synthesize(['DOOR'], 'delivery', 'te');
      expect(te.sentence).toContain('తలుపు బయట ఉంచండి');
    });

    it('synthesizes coming down elevator instructions', () => {
      const en = DialogueSynthesizer.synthesize(['COMING_DOWN'], 'delivery', 'en');
      expect(en.sentence).toContain('taking the elevator down');
    });

    it('synthesizes floor 2 instructions', () => {
      const en = DialogueSynthesizer.synthesize(['FLOOR_2'], 'delivery', 'en');
      expect(en.sentence).toContain('2nd floor');
    });

    it('synthesizes delivery OTP verification codes', () => {
      const en = DialogueSynthesizer.synthesize(['OTP', '#9421'], 'delivery', 'en');
      expect(en.sentence).toContain('Your delivery verification OTP is 9421.');
    });
  });
});

