import type { Request, Response, NextFunction } from "express";
import { profileService } from "./profile.service";
import { successResponse } from "../../utils/response";

export const getMyProfileController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await profileService.getMyProfile(req.user!.id, req.user!.role);
    successResponse(res, result);
  } catch (err) {
    next(err);
  }
};

export const updateProfileController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await profileService.updateProfile(req.user!.id, req.body);
    successResponse(res, result);
  } catch (err) {
    next(err);
  }
};

export const updatePatientProfileController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await profileService.updatePatientProfile(req.user!.id, req.body);
    successResponse(res, result);
  } catch (err) {
    next(err);
  }
};

export const updateDoctorProfileController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await profileService.updateDoctorProfile(req.user!.id, req.body);
    successResponse(res, result);
  } catch (err) {
    next(err);
  }
};

export const updateDoctorVisibilityController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await profileService.updateDoctorVisibility(req.user!.id, req.body);
    successResponse(res, result);
  } catch (err) {
    next(err);
  }
};

export const changePasswordController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await profileService.changePassword(req.user!.id, req.body.current_password, req.body.new_password);
    successResponse(res, { message: "Password changed successfully" });
  } catch (err) {
    next(err);
  }
};

export const send2FAOTPController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await profileService.send2FAOTP(req.user!.id, req.body.purpose);
    successResponse(res, { message: "OTP sent to your email" });
  } catch (err) {
    next(err);
  }
};

export const enable2FAController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await profileService.enable2FA(req.user!.id, req.body.otp);
    successResponse(res, { message: "2FA enabled successfully" });
  } catch (err) {
    next(err);
  }
};

export const disable2FAController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await profileService.disable2FA(req.user!.id, req.body.otp);
    successResponse(res, { message: "2FA disabled successfully" });
  } catch (err) {
    next(err);
  }
};

export const initiateDeleteController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await profileService.initiateDelete(req.user!.id);
    successResponse(res, result);
  } catch (err) {
    next(err);
  }
};

export const confirmDeleteOTPController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await profileService.confirmDeleteOTP(req.user!.id, req.body.otp);
    successResponse(res, result);
  } catch (err) {
    next(err);
  }
};

export const finalDeleteController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await profileService.finalDelete(req.user!.id, req.body.deletion_token, req.body.reason);
    successResponse(res, { message: "Account deleted successfully" });
  } catch (err) {
    next(err);
  }
};

export const getDoctorPublicProfileController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await profileService.getDoctorPublicProfile(req.params.doctorId);
    successResponse(res, result);
  } catch (err) {
    next(err);
  }
};
