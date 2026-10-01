-- Add primary_care role to Role enum (matches raw requirements: vårdcentral as a login role)
ALTER TYPE "Role" ADD VALUE 'primary_care';
