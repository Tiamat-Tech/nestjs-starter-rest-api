import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from '../services/auth.service';
import { validateOrReject } from 'class-validator';
import { RegisterInput } from '../dtos/auth-register-input.dto';
import { LoginInput } from '../dtos/auth-login-input.dto';
import { RefreshTokenInput } from '../dtos/auth-refresh-token-input.dto';
import { plainToClass } from 'class-transformer';
import { AuthToken, TokenUserIdentity } from '../dtos/token.dto';

describe('AuthController', () => {
  let moduleRef: TestingModule;
  let authController: AuthController;
  const mockedAuthService = {
    register: jest.fn(),
    login: jest.fn(),
    refreshToken: jest.fn(),
  };

  beforeEach(async () => {
    moduleRef = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: mockedAuthService }],
    }).compile();

    authController = moduleRef.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(authController).toBeDefined();
  });

  describe('registerLocal', () => {
    it('should register new user', async () => {
      const registerInputDto = new RegisterInput();
      registerInputDto.name = 'John Doe';
      registerInputDto.username = 'john@example.com';
      registerInputDto.password = '123123';
      await validateOrReject(registerInputDto);

      jest
        .spyOn(mockedAuthService, 'register')
        .mockImplementation(async () => null);

      expect(await authController.registerLocal(registerInputDto)).toBe(null);
    });
  });

  describe('login', () => {
    it('should login user', async () => {
      const loginInputDto = new LoginInput();
      loginInputDto.username = 'john@example.com';
      loginInputDto.password = '123123';
      await validateOrReject(loginInputDto);

      const reqObject: any = {};

      jest
        .spyOn(mockedAuthService, 'login')
        .mockImplementation(async () => null);

      expect(await authController.login(reqObject, loginInputDto)).toBe(null);
    });
  });

  describe('refreshToken', () => {
    let mockTokenUser: TokenUserIdentity;
    let mockRefreshTokenInputDto: RefreshTokenInput;
    let mockAuthToken: AuthToken;
    let mockRequest: any;

    beforeEach(() => {
      mockTokenUser = { id: 1 };
      mockRefreshTokenInputDto = plainToClass(RefreshTokenInput, {
        refresh_token: 'mock_refrsh_token',
      });
      mockAuthToken = {
        access_token: 'new_access_token',
        refresh_token: 'new_refresh_token',
      };
      mockRequest = {
        user: mockTokenUser,
      };

      jest
        .spyOn(mockedAuthService, 'refreshToken')
        .mockImplementation(async () => mockAuthToken);
    });

    it('should generate refresh token', async () => {
      await validateOrReject(mockRefreshTokenInputDto);
      const response = await authController.refreshToken(
        mockRequest,
        mockRefreshTokenInputDto,
      );

      expect(mockedAuthService.refreshToken).toBeCalledWith(mockTokenUser);
      expect(response).toEqual(mockAuthToken);
    });

    afterEach(() => {
      jest.resetAllMocks();
    });
  });
});
