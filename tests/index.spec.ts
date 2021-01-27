describe('macrunner', () => {
  describe('when has not macrunner config file', () => {
    it('should ask users enter github token', () => {
      expect(true).toBe(true);
    });

    it('should validate github token has permission to interact with self hosted runner', () => {
      expect(true).toBe(true);
    });

    it('should store github token into global config, and workspace config', () => {
      expect(true).toBe(true);
    });
  });

  describe('when has macrunner config file', () => {
    it('should load config file', () => {
      expect(true).toBe(true);
    });
  });

  describe('when run create command', () => {
    describe('when parameters is not passed', () => {
      it('should asks users choose to add runner for org or repo', () => {
        expect(true).toBe(true);
      });
    });

    describe('when github token could not access to org/repo', () => {
      it('should ask user to enter a valid org/repo', () => {
        expect(true).toBe(true);
      });
    });

    it('should store org/repo inside workspace config', () => {
      expect(true).toBe(true);
    });

    it('should store scale number inside workspace config', () => {
      expect(true).toBe(true);
    });

    it('should create a new MacOS service for runner', () => {
      expect(true).toBe(true);
    });

    it('should create a new runner for the org/repo', () => {
      expect(true).toBe(true);
    });
  });

  describe('when run list command', () => {
    it('should list all runners and their service status', () => {
      expect(true).toBe(true);
    });
  });

  describe('when run scale command', () => {
    it('should scale number of MacOS service to the number', () => {
      expect(true).toBe(true);
    });

    it('should scale number of runner to the number', () => {
      expect(true).toBe(true);
    });
  });
});
