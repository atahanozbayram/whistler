import express from "express";

export interface TypedRequestBody<T> extends express.Request {
	body: T;
}
