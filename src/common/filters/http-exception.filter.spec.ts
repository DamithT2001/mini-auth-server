import { HttpException, HttpStatus } from '@nestjs/common';
import { HttpExceptionFilter } from './http-exception.filter';

const mockJson = jest.fn();
const mockStatus = jest.fn().mockReturnValue({ json: mockJson });
const mockGetResponse = jest.fn().mockReturnValue({ status: mockStatus });
const mockSwitchToHttp = jest.fn().mockReturnValue({
  getResponse: mockGetResponse,
});
const mockHost = {
  switchToHttp: mockSwitchToHttp,
} as any;

describe('HttpExceptionFilter', () => {
  let filter: HttpExceptionFilter;

  beforeEach(() => {
    filter = new HttpExceptionFilter();
    jest.clearAllMocks();
    mockStatus.mockReturnValue({ json: mockJson });
  });

  it('should format a string message exception', () => {
    const exception = new HttpException('Forbidden', HttpStatus.FORBIDDEN);

    filter.catch(exception, mockHost);

    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.FORBIDDEN);
    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.FORBIDDEN,
        message: 'Forbidden',
      }),
    );
  });

  it('should return all validation error messages as an array', () => {
    const messages = ['email must be valid', 'password is too short'];
    const exception = new HttpException(
      { message: messages, error: 'Bad Request' },
      HttpStatus.BAD_REQUEST,
    );

    filter.catch(exception, mockHost);

    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.BAD_REQUEST,
        message: messages,
      }),
    );
  });

  it('should return a single string message from object response', () => {
    const exception = new HttpException(
      { message: 'Email already registered', error: 'Conflict' },
      HttpStatus.CONFLICT,
    );

    filter.catch(exception, mockHost);

    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.CONFLICT,
        message: 'Email already registered',
      }),
    );
  });

  it('should include a timestamp in the response', () => {
    const exception = new HttpException('Error', HttpStatus.INTERNAL_SERVER_ERROR);

    filter.catch(exception, mockHost);

    const callArg = mockJson.mock.calls[0][0];
    expect(callArg).toHaveProperty('timestamp');
    expect(typeof callArg.timestamp).toBe('string');
  });
});
